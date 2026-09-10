import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Activity, Mic, MapPin, AlertCircle, CheckCircle, RefreshCw, Zap, ShieldAlert, Radio } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';
import { getBestAvailablePosition } from '../../services/locationService';

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

// AI never lowers a local signal. A failed or slow online service therefore
// cannot make an active local emergency signal less safe.
const fuseSafetyScores = (localScore, aiScore) => {
  const local = clampScore(localScore);
  if (!Number.isFinite(aiScore)) return local;
  return Math.max(local, clampScore((local * 0.65) + (aiScore * 0.35)));
};

const getAuthToken = () => (
  localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken')
);

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read the audio safety clip.'));
  reader.onloadend = () => resolve(String(reader.result || '').split(',').pop());
  reader.readAsDataURL(blob);
});

export default function AIThreatMonitor({ onTriggerAutoSOS, activeIncident }) {
  const [isEnabled, setIsEnabled] = useState(false);
  
  // When Safety Mode is OFF: motion is 0%, voice is 0%
  const [localMotionScore, setLocalMotionScore] = useState(0);
  const [localAudioScore, setLocalAudioScore] = useState(0);
  const [movementAiScore, setMovementAiScore] = useState(null);
  const [voiceAiScore, setVoiceAiScore] = useState(null);
  const [movementActivity, setMovementActivity] = useState('Not checked');
  const [voiceAiStatus, setVoiceAiStatus] = useState('Standby');
  const [movementAiStatus, setMovementAiStatus] = useState('Standby');
  
  // GPS route confidence calculated directly from live mobile GPS fix
  const [gpsScore, setGpsScore] = useState(0);
  const [gpsDetails, setGpsDetails] = useState(null);

  // Sensor & Permission states
  const [, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [, setMotionPermission] = useState('prompt');
  const [permissionError, setPermissionError] = useState(null);

  // 15-second Alert Modal countdown state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(15);
  const [alertReason, setAlertReason] = useState('');
  
  // Active incident deduplication tracking
  const hasTriggeredForCurrentIncident = useRef(false);

  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const rafIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const monitoringRef = useRef(false);
  const localMotionRef = useRef(0);
  const localAudioRef = useRef(0);
  const motionSamplesRef = useRef([]);
  const lastVoiceAnalysisRef = useRef(0);
  const lastMovementAnalysisRef = useRef(0);
  const voiceAnalysisInFlightRef = useRef(false);
  const movementAnalysisInFlightRef = useRef(false);

  // Track and read mobile GPS coordinates continuously
  useEffect(() => {
    let isMounted = true;

    async function updateGpsConfidence() {
      try {
        const pos = await getBestAvailablePosition();
        if (!isMounted) return;

        if (pos && Number.isFinite(pos.latitude) && Number.isFinite(pos.longitude)) {
          const acc = pos.accuracy || 15;
          // Calculate GPS Route / Location confidence:
          // Excellent GPS (<=10m) -> 95-98%, Normal (15-30m) -> 85-92%, Low (50m+) -> 70%
          const confidence = Math.max(45, Math.min(98, Math.round(100 - (acc * 0.5))));
          setGpsScore(confidence);
          setGpsDetails(pos);
        } else {
          setGpsScore(0);
          setGpsDetails(null);
        }
      } catch (err) {
        if (isMounted) {
          setGpsScore(0);
          setGpsDetails(null);
        }
      }
    }

    updateGpsConfidence();
    const interval = setInterval(updateGpsConfidence, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const motionScore = isEnabled ? fuseSafetyScores(localMotionScore, movementAiScore) : 0;
  const audioScore = isEnabled ? fuseSafetyScores(localAudioScore, voiceAiScore) : 0;

  // Calculate Overall Threat Score (0 - 100)
  // When Voice reaches 50 - 70, overall threat score reaches 70 - 90!
  // When Motion reaches 50 - 70, overall threat score reaches 70 - 90!
  let overallThreatScore = 0;
  if (isEnabled) {
    let score = Math.round((motionScore * 0.5) + (audioScore * 0.5));

    if (audioScore >= 50) {
      const voiceThreat = 70 + Math.min(25, ((audioScore - 50) / 20) * 20);
      score = Math.max(score, Math.round(voiceThreat));
    }

    if (motionScore >= 50) {
      const motionThreat = 70 + Math.min(25, ((motionScore - 50) / 20) * 20);
      score = Math.max(score, Math.round(motionThreat));
    }

    overallThreatScore = clampScore(score);
  }

  // Determine threat stage
  const threatLevel = !isEnabled ? 'IDLE' : overallThreatScore >= 70 ? 'HIGH' : overallThreatScore >= 40 ? 'MEDIUM' : 'LOW';

  const updateLocalMotionScore = (nextScore) => {
    const score = clampScore(nextScore);
    localMotionRef.current = score;
    setLocalMotionScore(score);
    return score;
  };

  const updateLocalAudioScore = (nextScore) => {
    const score = clampScore(nextScore);
    localAudioRef.current = score;
    setLocalAudioScore(score);
    return score;
  };

  const requestOnlineVoiceAnalysis = useCallback(async () => {
    if (!navigator.onLine || voiceAnalysisInFlightRef.current || !micStreamRef.current || !window.MediaRecorder) return;
    if (Date.now() - lastVoiceAnalysisRef.current < 15_000) return;

    try {
      voiceAnalysisInFlightRef.current = true;
      lastVoiceAnalysisRef.current = Date.now();
      setVoiceAiStatus('Checking online AI…');
      const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = preferredType
        ? new MediaRecorder(micStreamRef.current, { mimeType: preferredType })
        : new MediaRecorder(micStreamRef.current);
      const chunks = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        setVoiceAiStatus('Local monitoring active');
      };
      recorder.onstop = async () => {
        try {
          const clip = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          if (!clip.size) throw new Error('Audio clip was empty.');
          const token = getAuthToken();
          const response = await fetch(`${API_BASE_URL}/api/threat-analysis/voice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ audioBase64: await blobToBase64(clip), mimeType: clip.type })
          });
          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.message || 'Online voice AI is unavailable.');
          setVoiceAiScore(clampScore(data.aiDistressScore));
          setVoiceAiStatus(data.transcript ? `AI checked: “${data.transcript.slice(0, 72)}”` : 'AI checked: no distress speech');
        } catch {
          setVoiceAiStatus('Local monitoring active');
        } finally {
          voiceAnalysisInFlightRef.current = false;
          mediaRecorderRef.current = null;
        }
      };
      recorder.start();
      recordingTimerRef.current = setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 4_000);
    } catch {
      voiceAnalysisInFlightRef.current = false;
      setVoiceAiStatus('Local monitoring active');
    }
  }, []);

  const requestOnlineMovementAnalysis = useCallback(async () => {
    if (!navigator.onLine || movementAnalysisInFlightRef.current) return;
    if (Date.now() - lastMovementAnalysisRef.current < 15_000) return;
    const samples = motionSamplesRef.current.slice(-300);
    if (samples.length < 20) return;

    try {
      movementAnalysisInFlightRef.current = true;
      lastMovementAnalysisRef.current = Date.now();
      setMovementAiStatus('Checking online HAR…');
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/threat-analysis/movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ samples })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Online movement AI is unavailable.');
      setMovementAiScore(clampScore(data.aiMovementScore));
      setMovementActivity(`${data.activity || 'unknown'} (${Math.round((data.confidence || 0) * 100)}%)`);
      setMovementAiStatus(data.abnormal ? 'AI flagged abnormal movement' : 'AI checked normal movement');
    } catch {
      setMovementAiStatus('Local monitoring active');
    } finally {
      movementAnalysisInFlightRef.current = false;
    }
  }, []);

  // Sensor Permission & Activation Handler
  const requestSensorsPermission = async () => {
    setPermissionError(null);

    // Set initial baseline scores on activation
    updateLocalMotionScore(10);
    updateLocalAudioScore(8);
    setVoiceAiStatus('Local monitoring active');
    setMovementAiStatus('Local monitoring active');

    // 1. Request Microphone access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicPermission('granted');

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          source.connect(analyser);
          audioAnalyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!monitoringRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // Distress scream detection: high energy in human voice frequency band (900Hz - 4000Hz)
            const binHz = ctx.sampleRate / analyser.fftSize;
            const startBin = Math.max(0, Math.floor(900 / binHz));
            const endBin = Math.min(bufferLength, Math.ceil(4_000 / binHz));
            let voiceBandSum = 0;
            for (let i = startBin; i < endBin; i++) voiceBandSum += dataArray[i];
            const voiceBandAverage = voiceBandSum / Math.max(1, endBin - startBin);
            
            const volumeScore = (average / 128) * 100;
            const voiceBandScore = (voiceBandAverage / 128) * 100;
            const calculatedAudio = clampScore((volumeScore * 0.42) + (voiceBandScore * 0.58));
            
            const nextAudio = Math.max(calculatedAudio, Math.max(5, localAudioRef.current - 2));
            updateLocalAudioScore(nextAudio);

            if (nextAudio >= 35) requestOnlineVoiceAnalysis();
            rafIdRef.current = requestAnimationFrame(updateVolume);
          };
          monitoringRef.current = true;
          updateVolume();
        }
      } else {
        setMicPermission('unsupported');
      }
    } catch (err) {
      console.warn('Microphone permission denied:', err);
      setMicPermission('denied');
      setPermissionError('Microphone permission denied. Speech and noise detection will use fallback monitoring.');
    }

    // 2. Request Motion sensor access
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission();
        setMotionPermission(res === 'granted' ? 'granted' : 'denied');
      } else if ('DeviceMotionEvent' in window) {
        setMotionPermission('granted');
      } else {
        setMotionPermission('unsupported');
      }
    } catch {
      setMotionPermission('denied');
    }

    monitoringRef.current = true;
    setIsEnabled(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      monitoringRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
      audioContextRef.current?.close?.().catch(() => {});
      micStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, []);

  // Device Motion Listener for Violent Shaking / Jolt Detection
  useEffect(() => {
    if (!isEnabled) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    const handleMotion = (event) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;
      
      const deltaX = Math.abs((acc.x || 0) - lastX);
      const deltaY = Math.abs((acc.y || 0) - lastY);
      const deltaZ = Math.abs((acc.z || 0) - lastZ);
      const totalDelta = deltaX + deltaY + deltaZ;

      lastX = acc.x || 0;
      lastY = acc.y || 0;
      lastZ = acc.z || 0;

      const now = Date.now();
      const rotation = event.rotationRate || {};
      motionSamplesRef.current.push({
        timestamp: now,
        ax: Number(acc.x || 0), ay: Number(acc.y || 0), az: Number(acc.z || 0),
        gx: Number(rotation.alpha || 0), gy: Number(rotation.beta || 0), gz: Number(rotation.gamma || 0)
      });
      motionSamplesRef.current = motionSamplesRef.current.filter((sample) => now - sample.timestamp <= 10_000);

      // Violent shake / jolt detection threshold: sudden movement > 16 m/s²
      if (totalDelta > 16) {
        const spike = Math.min(100, Math.round(totalDelta * 3.5));
        const nextMotion = updateLocalMotionScore(spike);
        if (nextMotion >= 35) requestOnlineMovementAnalysis();
      } else {
        // Slowly decay back to baseline walking score (10-15)
        updateLocalMotionScore(Math.max(10, Math.round(localMotionRef.current * 0.95)));
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isEnabled, requestOnlineMovementAnalysis]);

  // 15-Second Alert Countdown Timer Effect
  useEffect(() => {
    let timer;
    if (showAlertModal) {
      timer = setInterval(() => {
        setAlertCountdown((prev) => {
          if (prev <= 1) {
            // 15-second countdown expired without dismissal -> Dispatch SOS immediately!
            setShowAlertModal(false);
            if (!hasTriggeredForCurrentIncident.current && onTriggerAutoSOS) {
              hasTriggeredForCurrentIncident.current = true;
              onTriggerAutoSOS({
                triggerSource: 'threat_detection',
                threatScore: overallThreatScore || 85,
                threatDetails: {
                  localMotionScore,
                  movementAiScore,
                  motionScore,
                  localAudioScore,
                  voiceAiScore,
                  audioScore,
                  gpsScore,
                  reason: alertReason || 'High threat anomaly detected'
                }
              });
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showAlertModal, overallThreatScore, localMotionScore, movementAiScore, motionScore, localAudioScore, voiceAiScore, audioScore, gpsScore, alertReason, onTriggerAutoSOS]);

  // Threat Trigger Detection: Triggers 15-second timer when Threat Score reaches 70-90 (or high audio/motion)
  useEffect(() => {
    if (!isEnabled) return;

    if (!activeIncident) {
      hasTriggeredForCurrentIncident.current = false;
    }

    // When threat score reaches 70-90 (or voice/motion >= 50), start the 15-second countdown modal
    if (overallThreatScore >= 70 && !showAlertModal && !hasTriggeredForCurrentIncident.current && !activeIncident) {
      const reason = audioScore >= 50
        ? `Distress audio scream spike detected (Voice: ${audioScore}%, Threat: ${overallThreatScore})`
        : `Violent phone shaking / sudden impact detected (Motion: ${motionScore}%, Threat: ${overallThreatScore})`;
      setAlertReason(reason);
      setAlertCountdown(15);
      setShowAlertModal(true);
    }
  }, [overallThreatScore, audioScore, motionScore, isEnabled, showAlertModal, activeIncident]);

  const handleDismissAlert = () => {
    setShowAlertModal(false);
    setAlertCountdown(15);
    // Lower scores to normal baseline after user confirms safety
    updateLocalMotionScore(10);
    updateLocalAudioScore(8);
    setMovementAiScore(null);
    setVoiceAiScore(null);
    setMovementActivity('Not checked');
    setVoiceAiStatus('Local monitoring active');
    setMovementAiStatus('Local monitoring active');
  };

  // Interactive Simulation triggers
  const simulateJolt = () => {
    updateLocalMotionScore(85);
  };

  const simulateScream = () => {
    // Setting audio to 65 scales overall threat score to ~85 (70-90 range)
    updateLocalAudioScore(65);
  };

  const simulateGpsDev = () => {
    setGpsScore((prev) => Math.max(25, prev - 45));
  };

  const resetBaseline = () => {
    if (isEnabled) {
      updateLocalMotionScore(10);
      updateLocalAudioScore(8);
      setVoiceAiStatus('Local monitoring active');
      setMovementAiStatus('Local monitoring active');
    } else {
      updateLocalMotionScore(0);
      updateLocalAudioScore(0);
      setVoiceAiStatus('Standby');
      setMovementAiStatus('Standby');
    }
    setMovementAiScore(null);
    setVoiceAiScore(null);
    setMovementActivity('Not checked');
    setShowAlertModal(false);
    setAlertCountdown(15);
    hasTriggeredForCurrentIncident.current = false;
  };

  const stopMonitoring = () => {
    monitoringRef.current = false;
    setIsEnabled(false);
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop();
    audioContextRef.current?.close?.().catch(() => {});
    micStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    audioContextRef.current = null;
    micStreamRef.current = null;
    audioAnalyserRef.current = null;
    mediaRecorderRef.current = null;
    
    // Reset motion and voice to 0 when disabled
    updateLocalMotionScore(0);
    updateLocalAudioScore(0);
    setMovementAiScore(null);
    setVoiceAiScore(null);
    setVoiceAiStatus('Standby');
    setMovementAiStatus('Standby');
    setShowAlertModal(false);
    setAlertCountdown(15);
  };

  return (
    <div className="premium-panel p-6 rounded-3xl border border-[#DCDDD5] bg-white shadow-sm space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#DCDDD5] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0EA] text-[#7A8E72] border border-[#DCDDD5]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-xl font-semibold text-[#28302A]">AI Threat Monitor</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0EA] text-[#7A8E72] border border-[#DCDDD5]">
                Multi-Signal AI
              </span>
            </div>
            <p className="text-xs text-[#687067] mt-0.5">
              Live motion, voice distress analysis, and mobile GPS route confidence.
            </p>
          </div>
        </div>

        <button
          onClick={isEnabled ? stopMonitoring : requestSensorsPermission}
          className={`px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all shadow-sm ${
            isEnabled
              ? 'bg-[#4F7D55]/15 text-[#4F7D55] border border-[#4F7D55]/30 hover:bg-[#4F7D55]/25'
              : 'bg-[#7A8E72] text-white hover:bg-[#66775f]'
          }`}
        >
          {isEnabled ? '● Safety Mode Active' : 'Enable Safety Mode'}
        </button>
      </div>

      {permissionError && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          {permissionError}
        </div>
      )}

      {/* Main Threat Score & Gauge */}
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] items-center">
        {/* Circular Gauge */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FAF8F5] border border-[#DCDDD5] text-center relative overflow-hidden">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-[#FAF0EA]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-700 ${
                  threatLevel === 'HIGH'
                    ? 'stroke-[#C62828]'
                    : threatLevel === 'MEDIUM'
                    ? 'stroke-[#C18A32]'
                    : threatLevel === 'LOW'
                    ? 'stroke-[#4F7D55]'
                    : 'stroke-[#B8A99A]'
                }`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * overallThreatScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono text-[#28302A] tracking-tight">
                {overallThreatScore}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[#687067]">
                Threat Score
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                threatLevel === 'HIGH'
                  ? 'bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30 animate-pulse'
                  : threatLevel === 'MEDIUM'
                  ? 'bg-[#C18A32]/15 text-[#C18A32] border border-[#C18A32]/30'
                  : threatLevel === 'LOW'
                  ? 'bg-[#4F7D55]/15 text-[#4F7D55] border border-[#4F7D55]/30'
                  : 'bg-gray-100 text-[#687067] border border-[#DCDDD5]'
              }`}
            >
              {threatLevel === 'IDLE' ? 'MONITORING STANDBY' : `${threatLevel} RISK LEVEL`}
            </span>
          </div>
        </div>

        {/* 3 Signal Meters */}
        <div className="space-y-4">
          {/* Signal 1: Motion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-[#28302A]">
                <Zap className="h-3.5 w-3.5 text-[#7A8E72]" /> Motion Sensor
              </span>
              <span className="font-mono text-[#687067]">{motionScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#FAF0EA] overflow-hidden">
              <div
                className="h-full bg-[#7A8E72] transition-all duration-300"
                style={{ width: `${motionScore}%` }}
              />
            </div>
            <p className="text-[10px] text-[#687067]">
              {isEnabled ? `${movementAiStatus} · ${movementActivity}` : 'Safety mode off (0%)'}
            </p>
          </div>

          {/* Signal 2: Voice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-[#28302A]">
                <Mic className="h-3.5 w-3.5 text-[#A8B8A0]" /> Voice Distress Level
              </span>
              <span className="font-mono text-[#687067]">{audioScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#FAF0EA] overflow-hidden">
              <div
                className="h-full bg-[#A8B8A0] transition-all duration-300"
                style={{ width: `${audioScore}%` }}
              />
            </div>
            <p className="text-[10px] text-[#687067]">
              {isEnabled ? voiceAiStatus : 'Safety mode off (0%)'}
            </p>
          </div>

          {/* Signal 3: GPS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-[#28302A]">
                <MapPin className="h-3.5 w-3.5 text-[#4F7D55]" /> GPS Route Confidence
              </span>
              <span className="font-mono text-[#687067]">{gpsScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#FAF0EA] overflow-hidden">
              <div
                className="h-full bg-[#4F7D55] transition-all duration-300"
                style={{ width: `${gpsScore}%` }}
              />
            </div>
            <p className="text-[10px] text-[#687067]">
              {gpsDetails
                ? `📍 Live Mobile GPS (±${Math.round(gpsDetails.accuracy || 0)}m accuracy)`
                : 'Reading mobile GPS coordinates…'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Simulation Controls for Demo */}
      <div className="pt-4 border-t border-[#DCDDD5]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687067] mb-3">
          Interactive Demo Simulation Triggers
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={simulateJolt}
            disabled={!isEnabled}
            className="btn-secondary text-xs py-2 px-3 border-[#DCDDD5] hover:border-[#7A8E72] disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5 text-[#7A8E72]" /> Violent Jolt (+85)
          </button>
          <button
            onClick={simulateScream}
            disabled={!isEnabled}
            className="btn-secondary text-xs py-2 px-3 border-[#DCDDD5] hover:border-[#A8B8A0] disabled:opacity-40"
          >
            <Mic className="h-3.5 w-3.5 text-[#A8B8A0]" /> Audio Scream (+65)
          </button>
          <button
            onClick={simulateGpsDev}
            disabled={!isEnabled}
            className="btn-secondary text-xs py-2 px-3 border-[#DCDDD5] hover:border-[#4F7D55] disabled:opacity-40"
          >
            <MapPin className="h-3.5 w-3.5 text-[#4F7D55]" /> GPS Detour (-45)
          </button>
          <button
            onClick={resetBaseline}
            className="btn-secondary text-xs py-2 px-3 opacity-80"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* 15-Second Alert Countdown Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl border border-[#C62828]/40 bg-white p-6 text-center shadow-2xl space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#C62828] text-white shadow-xl animate-pulse">
              <ShieldAlert className="h-10 w-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30 text-[10px] font-bold uppercase tracking-widest">
                CRITICAL THREAT DETECTED (SCORE: {overallThreatScore})
              </span>
              <h3 className="font-headline text-2xl font-bold text-[#28302A] mt-2">
                Emergency Alert Escalation
              </h3>
              <p className="text-xs text-[#687067] mt-1.5">
                {alertReason || 'Unusual motion or audio distress spike detected. Are you safe?'}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-5xl font-mono font-extrabold text-[#C62828] animate-bounce">
                {alertCountdown}s
              </div>
              <p className="text-xs text-[#687067] mt-1">
                Auto-dispatching SOS to nearby command center & emergency guardians in {alertCountdown} seconds.
              </p>
            </div>

            <button
              onClick={handleDismissAlert}
              className="w-full py-4 rounded-2xl bg-[#FAF0EA] hover:bg-[#f3e5dc] text-[#28302A] font-bold text-base border border-[#DCDDD5] shadow-md transition-all cursor-pointer"
            >
              I'M FINE - CANCEL ALERT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
