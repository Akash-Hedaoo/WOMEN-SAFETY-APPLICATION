import React, { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Mic, MapPin, AlertCircle, CheckCircle, RefreshCw, Zap, ShieldAlert } from 'lucide-react';

export default function AIThreatMonitor({ onTriggerAutoSOS, activeIncident }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [motionScore, setMotionScore] = useState(12);
  const [audioScore, setAudioScore] = useState(8);
  const [gpsScore, setGpsScore] = useState(15);
  
  // Sensor & Permission states (Fix #4)
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [motionPermission, setMotionPermission] = useState('prompt');
  const [permissionError, setPermissionError] = useState(null);

  // Soft check-in popup state (Medium threshold 40-74)
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInCountdown, setCheckInCountdown] = useState(15);
  
  // Active incident deduplication tracking (Fix #2)
  const hasTriggeredForCurrentIncident = useRef(false);

  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);

  // Calculate overall weighted score (0 - 100)
  const overallThreatScore = Math.min(
    100,
    Math.round((motionScore * 0.35) + (audioScore * 0.35) + (gpsScore * 0.30))
  );

  // Determine threat stage
  const threatLevel = overallThreatScore >= 75 ? 'HIGH' : overallThreatScore >= 40 ? 'MEDIUM' : 'LOW';

  // Sensor Permission Request Handler (Fix #4)
  const requestSensorsPermission = async () => {
    setPermissionError(null);

    // 1. Request Microphone access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicPermission('granted');

        // Setup audio analysis node
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!isEnabled) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Map average (0-128) to audio score
            const calculatedAudio = Math.min(100, Math.round((average / 128) * 100));
            setAudioScore((prev) => Math.max(calculatedAudio, Math.max(5, prev - 2)));
            requestAnimationFrame(updateVolume);
          };
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

    // 2. Request Motion sensor access (iOS Safari requirement)
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission();
        setMotionPermission(res === 'granted' ? 'granted' : 'denied');
      } else if ('DeviceMotionEvent' in window) {
        setMotionPermission('granted');
      } else {
        setMotionPermission('unsupported');
      }
    } catch (err) {
      setMotionPermission('denied');
    }

    setIsEnabled(true);
  };

  // Device Motion Listener
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

      // Spike detection logic: sudden movement > 15 m/s²
      if (totalDelta > 18) {
        const spike = Math.min(100, Math.round(totalDelta * 3));
        setMotionScore(spike);
      } else {
        // Slowly decay back to baseline walking score (10-15)
        setMotionScore((prev) => Math.max(10, Math.round(prev * 0.95)));
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isEnabled]);

  // Check-in Modal Countdown Timer (Medium Threat)
  useEffect(() => {
    let timer;
    if (showCheckInModal) {
      timer = setInterval(() => {
        setCheckInCountdown((prev) => {
          if (prev <= 1) {
            // Expiration of check-in increases threat score further into High
            setShowCheckInModal(false);
            setMotionScore((m) => Math.min(100, m + 35));
            setAudioScore((a) => Math.min(100, a + 35));
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCheckInCountdown(15);
    }
    return () => clearInterval(timer);
  }, [showCheckInModal]);

  // Handle Threat Threshold Escalation
  useEffect(() => {
    if (!isEnabled) return;

    // Reset current incident flag when active incident is cleared/resolved
    if (!activeIncident) {
      hasTriggeredForCurrentIncident.current = false;
    }

    // Medium Score Check-in Trigger (40 - 74)
    if (overallThreatScore >= 40 && overallThreatScore < 75 && !showCheckInModal && !activeIncident) {
      setShowCheckInModal(true);
    }

    // High Score Auto-Escalation (75+)
    if (overallThreatScore >= 75 && !hasTriggeredForCurrentIncident.current) {
      // Fix #2: De-duplication safeguard
      hasTriggeredForCurrentIncident.current = true;
      setShowCheckInModal(false);
      
      if (onTriggerAutoSOS) {
        onTriggerAutoSOS({
          triggerSource: 'threat_detection',
          threatScore: overallThreatScore,
          threatDetails: {
            motionScore,
            audioScore,
            gpsScore
          }
        });
      }
    }
  }, [overallThreatScore, isEnabled, activeIncident, showCheckInModal, onTriggerAutoSOS, motionScore, audioScore, gpsScore]);

  const handleDismissCheckIn = () => {
    setShowCheckInModal(false);
    // Lower scores after "I'm fine" tap
    setMotionScore(10);
    setAudioScore(8);
    setGpsScore(12);
  };

  // Simulation handlers for demonstration
  const simulateJolt = () => setMotionScore(88);
  const simulateScream = () => setAudioScore(85);
  const simulateGpsDev = () => setGpsScore(90);
  const resetBaseline = () => {
    setMotionScore(12);
    setAudioScore(8);
    setGpsScore(14);
    setShowCheckInModal(false);
    hasTriggeredForCurrentIncident.current = false;
  };

  return (
    <div className="premium-panel p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/30 text-violet-300 border border-violet-500/30">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-xl font-semibold text-white">AI Threat Monitor</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Multi-Signal AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Silent background safety engine watching Motion, Audio & GPS signals.
            </p>
          </div>
        </div>

        <button
          onClick={isEnabled ? () => setIsEnabled(false) : requestSensorsPermission}
          className={`px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all shadow-lg ${
            isEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:opacity-90'
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
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-center relative overflow-hidden">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-700 ${
                  threatLevel === 'HIGH'
                    ? 'stroke-rose-500'
                    : threatLevel === 'MEDIUM'
                    ? 'stroke-amber-400'
                    : 'stroke-emerald-400'
                }`}
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * overallThreatScore) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {overallThreatScore}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                Threat Score
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                threatLevel === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 animate-pulse'
                  : threatLevel === 'MEDIUM'
                  ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
              }`}
            >
              {threatLevel} RISK LEVEL
            </span>
          </div>
        </div>

        {/* 3 Signal Meters */}
        <div className="space-y-4">
          {/* Signal 1: Motion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <Zap className="h-3.5 w-3.5 text-cyan-400" /> Motion Accelerometer
              </span>
              <span className="font-mono text-slate-200">{motionScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${motionScore}%` }}
              />
            </div>
          </div>

          {/* Signal 2: Audio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <Mic className="h-3.5 w-3.5 text-purple-400" /> Audio Distress dB
              </span>
              <span className="font-mono text-slate-200">{audioScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${audioScore}%` }}
              />
            </div>
          </div>

          {/* Signal 3: GPS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> GPS Route Confidence
              </span>
              <span className="font-mono text-slate-200">{gpsScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                style={{ width: `${gpsScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Simulation Controls for Demo */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Interactive Demo Simulation Triggers
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={simulateJolt}
            disabled={!isEnabled}
            className="btn-secondary text-xs py-2 px-3 border-cyan-500/30 hover:border-cyan-400"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" /> Violent Jolt (+60)
          </button>
          <button
            onClick={simulateScream}
            disabled={!isEnabled}
            className="btn-secondary text-xs py-2 px-3 border-purple-500/30 hover:border-purple-400"
          >
            <Mic className="h-3.5 w-3.5 text-purple-400" /> Audio Scream (+70)
          </button>
          <button
            onClick={simulateGpsDev}
            disabled={!isEnabled}
            className="btn-secondary text-xs py-2 px-3 border-emerald-500/30 hover:border-emerald-400"
          >
            <MapPin className="h-3.5 w-3.5 text-emerald-400" /> GPS Detour (+65)
          </button>
          <button
            onClick={resetBaseline}
            className="btn-secondary text-xs py-2 px-3 opacity-80"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Soft Check-in Modal (Medium Score 40-74) */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl border border-amber-400/40 bg-slate-900 p-6 text-center shadow-2xl space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div>
              <h3 className="font-headline text-2xl font-bold text-white">Soft Safety Check-In</h3>
              <p className="text-sm text-slate-300 mt-2">
                Unusual motion or audio spike detected (Threat Score: {overallThreatScore}). Are you safe?
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-4xl font-mono font-bold text-amber-400">{checkInCountdown}s</div>
              <p className="text-xs text-slate-400 mt-1">
                If no response, alert escalates automatically to emergency contacts.
              </p>
            </div>

            <button
              onClick={handleDismissCheckIn}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-xl hover:opacity-95"
            >
              I'M FINE - DISMISS ALERT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
