import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShieldAlert, Users, Phone, Activity, Volume2, Radio, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import io from 'socket.io-client';
import AIThreatMonitor from '../components/Safety/AIThreatMonitor';
import VoiceSOSListener from '../components/Safety/VoiceSOSListener';
import { API_BASE_URL, ROUTES } from '../utils/constants';

const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function SOSPage() {
  const [stage, setStage] = useState('idle'); // 'idle' | 'confirming' | 'active' | 'cancelled' | 'safe'
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('MANUAL'); // 'MANUAL' | 'THREAT_AI' | 'VOICE'

  const [activeAlertDetails, setActiveAlertDetails] = useState(null);
  const [guardiansList, setGuardiansList] = useState([]);
  const [isLoadingGuardians, setIsLoadingGuardians] = useState(true);
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const socketRef = useRef(null);

  const currentUser = getStoredUser();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch real guardians from MongoDB
  const fetchGuardians = useCallback(async () => {
    try {
      setIsLoadingGuardians(true);
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/guardian`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const allGuardians = [
          ...(data.verified || []).map((g) => ({ ...g, isVerified: true })),
          ...(data.pending || []).map((g) => ({ ...g, isVerified: false }))
        ];
        setGuardiansList(allGuardians);
      }
    } catch (err) {
      console.error('Failed to fetch guardians:', err);
    } finally {
      setIsLoadingGuardians(false);
    }
  }, []);

  // Fetch real SOS history from MongoDB
  const fetchSosHistory = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/sos/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.alerts)) {
          const formatted = data.alerts.map((a) => {
            const timeStr = new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
            const sourceLabel = a.triggerSource === 'threat_detection'
              ? 'AI Threat Trigger'
              : a.triggerSource === 'voice_trigger'
              ? 'Voice Phrase SOS'
              : 'Manual SOS Button';

            return {
              id: a._id,
              action: `${sourceLabel} (Score: ${a.threatScore || 0})`,
              time: `${dateStr}, ${timeStr}`,
              status: a.status === 'active' ? 'Active' : a.status === 'resolved' ? 'Resolved' : 'Cancelled',
              statusColor: a.status === 'active' ? 'text-rose-400' : a.status === 'resolved' ? 'text-emerald-400' : 'text-slate-400'
            };
          });
          setLogs(formatted);
        }
      }
    } catch (err) {
      console.error('Failed to fetch SOS history:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Check if there is an active SOS already running in MongoDB
  const checkActiveSos = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/sos/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hasActiveAlert && data.alert) {
          setStage('active');
          setActiveAlertDetails(data.alert);
          const start = new Date(data.alert.createdAt).getTime();
          const now = Date.now();
          setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
        }
      }
    } catch (err) {
      console.error('Failed to check active SOS:', err);
    }
  }, []);

  // Real-time Socket.IO Connection
  useEffect(() => {
    fetchGuardians();
    fetchSosHistory();
    checkActiveSos();

    const token = getAuthToken();
    if (!token) return;

    const socket = io(API_BASE_URL || window.location.origin, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    if (currentUser?._id) {
      socket.emit('join-sos-room', currentUser._id);
    }

    socket.on('sos-triggered', (payload) => {
      setStage('active');
      setActiveAlertDetails(payload);
      fetchSosHistory();
    });

    socket.on('sos-cancelled', () => {
      setStage('cancelled');
      setActiveAlertDetails(null);
      fetchSosHistory();
    });

    socket.on('user-safe', () => {
      setStage('safe');
      setActiveAlertDetails(null);
      fetchSosHistory();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchGuardians, fetchSosHistory, checkActiveSos, currentUser?._id]);

  // Countdown timer for 3-second abort window
  useEffect(() => {
    let timer;
    if (stage === 'confirming') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            triggerSosApi({ triggerSource: 'manual_button' });
            setStage('active');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // Elapsed timer when active
  useEffect(() => {
    let timer;
    if (stage === 'active') {
      timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } else if (stage !== 'active') {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // Trigger Real SOS API Call
  const triggerSosApi = async (payload) => {
    try {
      const token = getAuthToken();
      if (!token) {
        showToast('Please login to send SOS alerts.');
        return;
      }

      let latitude = 18.5204;
      let longitude = 73.8567;

      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 4000 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch (e) {
          // fallback to network IP
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/sos/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude,
          longitude,
          triggerSource: payload?.triggerSource || 'manual_button',
          threatScore: payload?.threatScore || (payload?.triggerSource === 'threat_detection' ? 88 : 0),
          threatDetails: payload?.threatDetails || {},
          message: payload?.message || 'Emergency assistance needed immediately!'
        })
      });

      const data = await res.json();
      if (data.success) {
        setStage('active');
        setActiveAlertDetails(data.alert || data);
        showToast(`🚨 SOS Dispatched! Alerted ${data.guardiansAlerted || guardiansList.length} guardians & ICCC.`);
        fetchSosHistory();
      } else {
        showToast(data.message || 'Failed to dispatch SOS alert.');
      }
    } catch (err) {
      console.error('SOS Trigger Error:', err);
      showToast('Error communicating with SOS server.');
    }
  };

  // Cancel Active SOS
  const handleCancelSOS = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/sos/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        showToast(data.message || 'SOS alert cancelled successfully.');
      }
    } catch (e) {
      showToast('SOS alert cancelled.');
    } finally {
      setStage('cancelled');
      setCountdown(3);
      setElapsed(0);
      setActiveAlertDetails(null);
      fetchSosHistory();
    }
  };

  // Mark Safe in Database
  const handleMarkSafe = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/sos/mark-safe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        showToast(data.message || 'You are marked safe!');
      }
    } catch (e) {
      showToast('You are marked safe!');
    } finally {
      setStage('safe');
      setCountdown(3);
      setElapsed(0);
      setActiveAlertDetails(null);
      fetchSosHistory();
    }
  };

  const handleSOSClick = () => {
    if (stage === 'idle' || stage === 'cancelled' || stage === 'safe') {
      setStage('confirming');
      setCountdown(3);
    } else if (stage === 'confirming') {
      setStage('idle');
      setCountdown(3);
      showToast('SOS activation aborted.');
    }
  };

  return (
    <div className="page-shell min-h-screen pt-24 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-rose-500/40 bg-slate-950/95 px-6 py-3.5 text-sm text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toastMessage}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Status Indicator Banner */}
        <div
          className={`rounded-[28px] border px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.24em] transition-all flex items-center justify-center gap-2.5 ${
            stage === 'active'
              ? 'border-rose-400/40 bg-rose-500/20 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse'
              : stage === 'confirming'
              ? 'border-amber-400/40 bg-amber-500/20 text-amber-100'
              : stage === 'safe'
              ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
              : 'border-white/10 bg-white/6 text-slate-300'
          }`}
        >
          {stage === 'idle' && '🟢 Safe-Era Active · All Safety Channels Standing By'}
          {stage === 'confirming' && '⚠️ Preparing SOS Broadcast · Tap button again to abort'}
          {stage === 'active' && '🚨 Live SOS Active · Guardians Alerted via Socket & SMS'}
          {stage === 'cancelled' && '⚪ SOS Alert Cancelled · All parties notified'}
          {stage === 'safe' && '✅ Marked Safe · Emergency Incident Resolved'}
        </div>

        {/* Safety Mode Tabs */}
        <div className="flex items-center justify-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'MANUAL'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Manual SOS Button
          </button>

          <button
            onClick={() => setActiveTab('THREAT_AI')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'THREAT_AI'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" /> AI Threat Detection
          </button>

          <button
            onClick={() => setActiveTab('VOICE')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'VOICE'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Volume2 className="h-4 w-4" /> Voice-Triggered SOS
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-6">
            {/* Tab 1: Manual SOS Button */}
            {activeTab === 'MANUAL' && (
              <section className="premium-panel-strong p-6 md:p-8 rounded-[28px] border border-white/10 bg-slate-900/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                  <div className="relative flex items-center justify-center">
                    {stage === 'active' && (
                      <div className="absolute h-80 w-80 rounded-full bg-rose-500/25 blur-3xl animate-pulse" />
                    )}

                    <button
                      onClick={handleSOSClick}
                      disabled={stage === 'active'}
                      className={`relative flex h-64 w-64 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 ${
                        stage === 'idle' || stage === 'cancelled' || stage === 'safe'
                          ? 'border-rose-300/40 bg-gradient-to-br from-rose-500 to-pink-600 hover:scale-105 active:scale-95 shadow-rose-600/40'
                          : ''
                      } ${stage === 'confirming' ? 'border-amber-300/50 bg-gradient-to-br from-amber-500 to-orange-600 scale-105 animate-bounce' : ''} ${
                        stage === 'active' ? 'border-rose-400/50 bg-gradient-to-br from-slate-950 via-rose-950 to-rose-700 shadow-rose-600/50' : ''
                      }`}
                    >
                      {(stage === 'idle' || stage === 'cancelled' || stage === 'safe') && (
                        <div className="space-y-2 text-white">
                          <ShieldAlert className="mx-auto h-16 w-16" />
                          <div className="text-5xl font-bold tracking-tight">SOS</div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.26em] opacity-90">
                            Press for Emergency
                          </p>
                        </div>
                      )}

                      {stage === 'confirming' && (
                        <div className="space-y-1 text-white">
                          <div className="text-7xl font-extrabold">{countdown}</div>
                          <p className="text-[10px] font-bold uppercase tracking-wider">Tap to Abort</p>
                        </div>
                      )}

                      {stage === 'active' && (
                        <div className="space-y-3 text-white">
                          <Clock className="mx-auto h-10 w-10 text-rose-300 animate-spin-slow" />
                          <div className="font-mono text-4xl font-bold">
                            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-200">
                            🚨 SOS Dispatched
                          </p>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Action Controls */}
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {stage === 'active' ? (
                      <>
                        <button
                          onClick={handleMarkSafe}
                          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-emerald-600/30"
                        >
                          ✓ Mark Myself Safe
                        </button>
                        <button
                          onClick={handleCancelSOS}
                          className="px-6 py-3 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs tracking-wider uppercase transition border border-rose-400/30"
                        >
                          Cancel SOS Alert
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => triggerSosApi({ triggerSource: 'manual_button', message: 'Test emergency drill' })}
                          className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs tracking-wider uppercase transition border border-white/10"
                        >
                          Trigger Instant SOS
                        </button>
                        <button
                          onClick={handleCancelSOS}
                          className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold text-xs tracking-wider uppercase transition"
                        >
                          Reset Status
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Tab 2: AI Threat Detection */}
            {activeTab === 'THREAT_AI' && (
              <AIThreatMonitor
                onTriggerAutoSOS={(threatPayload) => triggerSosApi(threatPayload)}
                activeIncident={stage === 'active' ? activeAlertDetails : null}
              />
            )}

            {/* Tab 3: Voice-Triggered SOS */}
            {activeTab === 'VOICE' && (
              <VoiceSOSListener
                onTriggerVoiceSOS={(voicePayload) => triggerSosApi(voicePayload)}
              />
            )}
          </div>

          {/* Right Sidebar: Real Guardians & Real DB Logs */}
          <aside className="space-y-6">
            {/* Real Guardians Panel */}
            <div className="premium-panel p-6 rounded-[28px] border border-white/10 bg-slate-900/80 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="h-5 w-5 text-violet-300" />
                  <h2 className="font-headline text-xl font-bold text-white">Emergency Guardians</h2>
                </div>
                <Link
                  to={ROUTES.GUARDIANS}
                  className="text-xs font-semibold text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {isLoadingGuardians ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading guardians from database...</div>
                ) : guardiansList.length === 0 ? (
                  <div className="p-5 text-center rounded-2xl border border-white/10 bg-white/5">
                    <p className="text-xs text-slate-400 mb-2">No guardians linked yet.</p>
                    <Link
                      to={ROUTES.GUARDIANS}
                      className="inline-block px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                    >
                      + Add Guardian Contact
                    </Link>
                  </div>
                ) : (
                  guardiansList.map((g, idx) => (
                    <div
                      key={g._id || idx}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold bg-violet-600/30 border border-violet-400/30 text-sm">
                          {g.guardianName ? g.guardianName[0].toUpperCase() : 'G'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm leading-tight">{g.guardianName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {g.relation} • {g.guardianPhone}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        g.isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {g.isVerified ? 'Linked ✓' : 'Pending OTP'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Real SOS Incident Logs from DB */}
            <div className="premium-panel p-6 rounded-[28px] border border-white/10 bg-slate-900/80 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-violet-300" />
                  <h2 className="font-headline text-xl font-bold text-white">Recent SOS Logs</h2>
                </div>
                <button
                  onClick={fetchSosHistory}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title="Refresh Logs"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {isLoadingLogs ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading incident records...</div>
                ) : logs.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 rounded-2xl border border-white/10 bg-white/5">
                    No past SOS alerts recorded. You are fully secure.
                  </div>
                ) : (
                  logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white text-xs leading-snug">{log.action}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{log.time}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 ${log.statusColor}`}>
                        {log.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

