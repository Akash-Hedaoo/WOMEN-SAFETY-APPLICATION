import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, ShieldAlert, CheckCircle2, AlertCircle, Sparkles, Radio, Activity } from 'lucide-react';

const TRIGGER_PHRASES = [
  'help me now',
  'i am not safe',
  'emergency help',
  'somebody help me',
  'sos emergency',
  'help me',
  'help',
  'save me',
  'not safe'
];

export default function VoiceSOSListener({ onTriggerVoiceSOS }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastMatchedPhrase, setLastMatchedPhrase] = useState('');
  const [detectedPhrase, setDetectedPhrase] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Fix #3: Trigger lock to prevent overlapping countdowns
  const [isTriggerLocked, setIsTriggerLocked] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // Fix #4: Speech & Mic Permission Status
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'granted' | 'denied' | 'unsupported'

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);

  // Check browser SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicState('unsupported');
    }
  }, []);

  // Handle Phrase Detection Match
  const handlePhraseMatched = (phrase) => {
    if (isTriggerLocked) return;
    setIsTriggerLocked(true);
    setDetectedPhrase(phrase);
    setLastMatchedPhrase(phrase);
    setCountdown(3);
  };

  // Start / Stop Listening Process
  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setMicState('idle');
      setAudioLevel(0);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (e) {}
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    } else {
      // Start listening
      setTranscript('');
      try {
        // 1. Request Mic & Audio Context for Decibel Meter Visualizer
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;

          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkVolume = () => {
              if (!micStreamRef.current) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
              const avg = sum / bufferLength;
              setAudioLevel(Math.min(100, Math.round((avg / 64) * 100)));
              requestAnimationFrame(checkVolume);
            };
            checkVolume();
          }
        }

        // 2. Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let currentText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentText += event.results[i][0].transcript.toLowerCase() + ' ';
            }
            setTranscript(currentText.trim());

            // Pattern Match against phrases
            const cleanText = currentText.toLowerCase().trim();
            for (const phrase of TRIGGER_PHRASES) {
              if (cleanText.includes(phrase)) {
                handlePhraseMatched(phrase);
                break;
              }
            }
          };

          recognition.onerror = (err) => {
            console.warn('Speech recognition error:', err.error);
            if (err.error === 'not-allowed') {
              setMicState('denied');
              setIsListening(false);
            }
          };

          recognition.onend = () => {
            // Auto-restart if listening is still enabled
            if (isListening && micState !== 'denied') {
              try {
                recognition.start();
              } catch (e) {
                // ignore
              }
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        }

        setIsListening(true);
        setMicState('listening');
      } catch (err) {
        console.warn('Mic permission or speech start error:', err);
        setMicState('denied');
        setIsListening(false);
      }
    }
  };

  // 3-Second Countdown Timer Effect
  useEffect(() => {
    let timer;
    if (isTriggerLocked && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isTriggerLocked && countdown === 0) {
      // Countdown finished -> Dispatch Voice SOS!
      if (onTriggerVoiceSOS) {
        onTriggerVoiceSOS({
          triggerSource: 'voice_trigger',
          threatDetails: { triggerPhrase: detectedPhrase || 'help me now' }
        });
      }
      setIsTriggerLocked(false);
      setDetectedPhrase(null);
    }
    return () => clearInterval(timer);
  }, [isTriggerLocked, countdown, detectedPhrase, onTriggerVoiceSOS]);

  const handleCancelCountdown = () => {
    setIsTriggerLocked(false);
    setDetectedPhrase(null);
    setCountdown(3);
    setTranscript('');
  };

  const simulatePhrase = (phrase) => {
    setTranscript(phrase);
    handlePhraseMatched(phrase);
  };

  return (
    <div className="premium-panel p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/30 text-pink-300 border border-pink-500/30">
            <Volume2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-xl font-semibold text-white">Voice-Triggered SOS</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Hands-Free Speech AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuously pattern-matches distress phrases like "help me now" or "I am not safe".
            </p>
          </div>
        </div>

        <button
          onClick={toggleListening}
          className={`px-5 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 ${
            isListening
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 animate-pulse'
              : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:opacity-90'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="h-4 w-4 text-rose-400 animate-bounce" /> ● Voice Listener Active
            </>
          ) : (
            <>
              <MicOff className="h-4 w-4 text-slate-300" /> Enable Voice Listener
            </>
          )}
        </button>
      </div>

      {/* Mic Status & Warnings */}
      {micState === 'denied' && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          Microphone permission is blocked in your browser. Enable mic access or use the trigger simulation buttons below.
        </div>
      )}

      {micState === 'unsupported' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          Native Web Speech API is limited in this browser. Voice simulation mode is enabled below for testing.
        </div>
      )}

      {/* Audio Visualizer & Speech Feed Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left: Active Phrases & Audio Level */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Mic Audio Signal Meter
            </span>
            <span className="font-mono text-xs text-pink-300 font-bold">{audioLevel}%</span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 transition-all duration-150"
              style={{ width: `${audioLevel}%` }}
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Recognized Trigger Phrases:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TRIGGER_PHRASES.map((phrase) => (
                <span
                  key={phrase}
                  onClick={() => simulatePhrase(phrase)}
                  className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300 hover:border-pink-500/40 hover:text-white cursor-pointer transition-all"
                >
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Speech Recognizer Feed */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Live Speech Recognizer Stream
              </span>
              {isListening && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 uppercase animate-pulse">
                  <Radio className="h-3 w-3" /> Listening
                </span>
              )}
            </div>
            
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 min-h-[60px] flex items-center">
              <p className="text-xs font-mono text-slate-200 italic">
                {transcript ? `"${transcript}"` : isListening ? 'Listening for speech patterns...' : 'Voice listener idle. Click button to start.'}
              </p>
            </div>
          </div>

          {/* Quick Simulation Triggers */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Demo Simulation:</span>
            <div className="flex gap-2">
              <button
                onClick={() => simulatePhrase('help me now')}
                className="btn-secondary text-[11px] py-1.5 px-3 border-pink-500/30 hover:border-pink-400"
              >
                <Sparkles className="h-3 w-3 text-pink-400" /> "Help me now"
              </button>
              <button
                onClick={() => simulatePhrase('i am not safe')}
                className="btn-secondary text-[11px] py-1.5 px-3 border-rose-500/30 hover:border-rose-400"
              >
                <Sparkles className="h-3 w-3 text-rose-400" /> "I am not safe"
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Second Cancel Countdown Overlay */}
      {isTriggerLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/40 bg-slate-900 p-8 text-center shadow-2xl space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/30 animate-ping">
              <ShieldAlert className="h-10 w-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 text-[10px] font-bold uppercase tracking-widest">
                Voice Phrase Detected: "{detectedPhrase}"
              </span>
              <h3 className="font-headline text-3xl font-extrabold text-white mt-3">
                DISPATCHING SOS
              </h3>
              <p className="text-xs text-slate-300 mt-2">
                Emergency alert will automatically notify guardians and local command centers in:
              </p>
            </div>

            <div className="text-6xl font-mono font-extrabold text-rose-400 animate-bounce">
              {countdown}
            </div>

            <button
              onClick={handleCancelCountdown}
              className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base border border-white/20 shadow-xl transition-all cursor-pointer"
            >
              CANCEL ALERT (FALSE TRIGGER)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
