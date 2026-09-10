import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, ShieldAlert, Users, Phone, Activity, Radio, AlertTriangle, ArrowRight, RefreshCw, Wifi, WifiOff, MessageSquare, Save } from 'lucide-react';
import io from 'socket.io-client';
import AIThreatMonitor from '../components/Safety/AIThreatMonitor';
import { API_BASE_URL, ROUTES } from '../utils/constants';
import { triggerSOS as triggerSOSService, startAutoSync } from '../services/sosService';
import { syncGuardians } from '../services/guardianCacheService';

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
  const [sosSteps, setSosSteps] = useState([]);
  const [sosMode, setSosMode] = useState(null); // 'online'|'offline_sms'|'queued_only'
  const [sosOtp, setSosOtp] = useState(null);
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
        const rawList = Array.isArray(data.guardians)
          ? data.guardians
          : Array.isArray(data.verified) || Array.isArray(data.pending)
          ? [...(data.verified || []), ...(data.pending || [])]
          : Array.isArray(data)
          ? data
          : [];

        const allGuardians = rawList.map((g) => ({
          ...g,
          isVerified: Boolean(g.isVerified ?? true)
        }));
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
              statusColor: a.status === 'active' ? 'text-[#C62828]' : a.status === 'resolved' ? 'text-[#4F7D55]' : 'text-[#687067]'
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

    // Sync guardian cache for offline SOS
    syncGuardians().catch(() => {});

    // Start auto-sync for pending offline SOS records
    const cleanupAutoSync = startAutoSync();

    const token = getAuthToken();
    if (!token) return cleanupAutoSync;

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
      cleanupAutoSync();
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

  // Trigger SOS — uses sosService for online/offline/no-signal flow
  const triggerSosApi = async (payload) => {
    try {
      const token = getAuthToken();
      if (!token) {
        showToast('Please login to send SOS alerts.');
        return;
      }

      const result = await triggerSOSService({
        triggerSource: payload?.triggerSource || 'manual_button',
        threatScore: payload?.threatScore || (payload?.triggerSource === 'threat_detection' ? 88 : 0),
        threatDetails: payload?.threatDetails || {},
        message: payload?.message || 'Emergency assistance needed immediately!',
      });

      setSosSteps(result.steps || []);
      setSosMode(result.mode);
      setSosOtp(result.otp);

      if (result.success) {
        setStage('active');
        if (result.alert) {
          setActiveAlertDetails(result.alert);
        }

        if (result.mode === 'online') {
          showToast(`🚨 SOS Dispatched! Guardians alerted via server.`);
        } else if (result.mode === 'offline_sms') {
          showToast(result.smsResult?.sent > 0
            ? `🚨 Emergency SMS sent from this phone to ${result.smsResult.sent} guardian(s).`
            : '🚨 Emergency SMS composer opened. Backend sync pending.');
        } else {
          showToast(`🚨 SOS saved locally. Will send when signal returns.`);
        }
        fetchSosHistory();
      } else {
        showToast('Failed to dispatch SOS alert.');
      }
    } catch (err) {
      console.error('SOS Trigger Error:', err);
      showToast('Error dispatching SOS alert.');
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
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#DCDDD5] bg-white px-6 py-3.5 text-sm text-[#28302A] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-[#4F7D55]" />
            {toastMessage}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Status Indicator Banner */}
        <div
          className={`rounded-[28px] border px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.24em] transition-all flex items-center justify-center gap-2.5 ${stage === 'active'
              ? 'border-[#C62828]/40 bg-[#C62828]/15 text-[#C62828] shadow-[0_0_24px_rgba(198,40,40,0.2)] animate-pulse'
              : stage === 'confirming'
                ? 'border-[#C18A32]/40 bg-[#C18A32]/15 text-[#C18A32]'
                : stage === 'safe'
                  ? 'border-[#4F7D55]/40 bg-[#4F7D55]/15 text-[#4F7D55]'
                  : 'border-[#DCDDD5] bg-white text-[#687067] shadow-sm'
            }`}
        >
          {stage === 'idle' && '🟢 Safe-Era Active · All Safety Channels Standing By'}
          {stage === 'confirming' && '⚠️ Preparing SOS Broadcast · Tap button again to abort'}
          {stage === 'active' && (sosMode === 'offline_sms'
            ? '🚨 Live SOS Active · Emergency SMS sent from this phone'
            : '🚨 Live SOS Active · Guardians Alerted via Socket & SMS')}
          {stage === 'cancelled' && '⚪ SOS Alert Cancelled · All parties notified'}
          {stage === 'safe' && '✅ Marked Safe · Emergency Incident Resolved'}
        </div>

        {/* Safety Mode Tabs */}
        <div className="flex items-center justify-center gap-2 border-b border-[#DCDDD5] pb-4">
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'MANUAL'
                ? 'bg-[#C62828] text-white shadow-md shadow-[#C62828]/25'
                : 'bg-white text-[#687067] border border-[#DCDDD5] hover:bg-[#FAF0EA] hover:text-[#28302A]'
              }`}
          >
            <ShieldAlert className="h-4 w-4" /> Manual SOS Button
          </button>

          <button
            onClick={() => setActiveTab('THREAT_AI')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'THREAT_AI'
                ? 'bg-[#7A8E72] text-white shadow-md shadow-[#7A8E72]/25'
                : 'bg-white text-[#687067] border border-[#DCDDD5] hover:bg-[#FAF0EA] hover:text-[#28302A]'
              }`}
          >
            <Activity className="h-4 w-4" /> AI Threat Detection
          </button>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-6">
            {/* Tab 1: Manual SOS Button */}
            {activeTab === 'MANUAL' && (
              <section className="premium-panel-strong p-6 md:p-8 rounded-[28px] border border-[#DCDDD5] bg-white shadow-sm">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                  <div className="relative flex items-center justify-center">
                    {stage === 'active' && (
                      <div className="absolute h-80 w-80 rounded-full bg-[#C62828]/20 blur-3xl animate-pulse" />
                    )}

                    <button
                      onClick={handleSOSClick}
                      disabled={stage === 'active'}
                      className={`relative flex h-64 w-64 items-center justify-center rounded-full border shadow-2xl transition-all duration-300 ${stage === 'idle' || stage === 'cancelled' || stage === 'safe'
                          ? 'border-[#C62828]/60 bg-[#C62828] hover:bg-[#b02222] hover:scale-105 active:scale-95 shadow-[0_12px_32px_rgba(198,40,40,0.35)]'
                          : ''
                        } ${stage === 'confirming' ? 'border-[#C18A32]/60 bg-[#C18A32] scale-105 animate-bounce' : ''} ${stage === 'active' ? 'border-[#C62828]/60 bg-[#9B1C1C] shadow-[0_12px_32px_rgba(198,40,40,0.45)]' : ''
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
                          <Clock className="mx-auto h-10 w-10 text-rose-200 animate-spin-slow" />
                          <div className="font-mono text-4xl font-bold">
                            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
                          </div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-100">
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
                          className="px-6 py-3 rounded-2xl bg-[#4F7D55] hover:bg-[#436b48] text-white font-bold text-xs tracking-wider uppercase transition shadow-md"
                        >
                          ✓ Mark Myself Safe
                        </button>
                        <button
                          onClick={handleCancelSOS}
                          className="px-6 py-3 rounded-2xl bg-[#C62828] hover:bg-[#b02222] text-white font-bold text-xs tracking-wider uppercase transition"
                        >
                          Cancel SOS Alert
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => triggerSosApi({ triggerSource: 'manual_button', message: 'Test emergency drill' })}
                          className="px-5 py-2.5 rounded-2xl bg-[#FAF0EA] hover:bg-[#f3e5dc] text-[#28302A] font-semibold text-xs tracking-wider uppercase transition border border-[#DCDDD5]"
                        >
                          Trigger Instant SOS
                        </button>
                        <button
                          onClick={handleCancelSOS}
                          className="px-5 py-2.5 rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#687067] hover:text-[#28302A] font-semibold text-xs tracking-wider uppercase transition border border-[#DCDDD5]"
                        >
                          Reset Status
                        </button>
                      </>
                    )}
                  </div>

                  {/* SOS Delivery Status Detail */}
                  {sosSteps.length > 0 && stage === 'active' && (
                    <div className="mt-6 w-full max-w-md mx-auto">
                      <div className="rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4 space-y-2.5">
                        <div className="flex items-center gap-2 mb-3">
                          {sosMode === 'online' && <Wifi className="h-4 w-4 text-[#4F7D55]" />}
                          {sosMode === 'offline_sms' && <MessageSquare className="h-4 w-4 text-[#C18A32]" />}
                          {sosMode === 'queued_only' && <Save className="h-4 w-4 text-[#C62828]" />}
                          <span className="text-xs font-bold uppercase tracking-wider text-[#28302A]">
                            {sosMode === 'online' && 'Online Dispatch'}
                            {sosMode === 'offline_sms' && 'Offline SMS Mode'}
                            {sosMode === 'queued_only' && 'Queued Locally'}
                          </span>
                        </div>
                        {sosSteps.map((s, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs">
                            <span className="mt-0.5 shrink-0">
                              {s.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-[#4F7D55]" />}
                              {s.status === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-[#C18A32]" />}
                              {s.status === 'pending' && <Clock className="h-3.5 w-3.5 text-[#7A8E72] animate-pulse" />}
                              {s.status === 'failed' && <AlertTriangle className="h-3.5 w-3.5 text-[#C62828]" />}
                            </span>
                            <div>
                              <span className="font-semibold text-[#28302A]">{s.step}: </span>
                              <span className="text-[#687067]">{s.detail}</span>
                            </div>
                          </div>
                        ))}
                        {sosOtp && (
                          <div className="mt-2 pt-2 border-t border-[#DCDDD5] text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#687067]">Emergency OTP</span>
                            <div className="text-2xl font-mono font-bold text-[#C62828] tracking-[0.3em]">{sosOtp}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
          </div>

          {/* Right Sidebar: Real Guardians & Real DB Logs */}
          <aside className="space-y-6">
            {/* Real Guardians Panel */}
            <div className="premium-panel p-6 rounded-[28px] border border-[#DCDDD5] bg-white shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Users className="h-5 w-5 text-[#7A8E72]" />
                  <h2 className="font-headline text-xl font-bold text-[#28302A]">Emergency Guardians</h2>
                </div>
                <Link
                  to={ROUTES.GUARDIANS}
                  className="text-xs font-semibold text-[#7A8E72] hover:text-[#5e6e58] inline-flex items-center gap-1"
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {isLoadingGuardians ? (
                  <div className="p-4 text-center text-xs text-[#687067]">Loading guardians from database...</div>
                ) : guardiansList.length === 0 ? (
                  <div className="p-5 text-center rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5]">
                    <p className="text-xs text-[#687067] mb-2">No guardians linked yet.</p>
                    <Link
                      to={ROUTES.GUARDIANS}
                      className="inline-block px-4 py-2 rounded-xl bg-[#7A8E72] hover:bg-[#66775f] text-white text-xs font-semibold"
                    >
                      + Add Guardian Contact
                    </Link>
                  </div>
                ) : (
                  guardiansList.map((g, idx) => (
                    <div
                      key={g._id || idx}
                      className="flex items-center justify-between rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7A8E72] font-bold bg-[#FAF0EA] border border-[#DCDDD5] text-sm">
                          {g.guardianName ? g.guardianName[0].toUpperCase() : 'G'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#28302A] text-sm leading-tight">{g.guardianName}</p>
                          <p className="text-[11px] text-[#687067] mt-0.5">
                            {g.relation} • {g.guardianPhone}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${g.isVerified ? 'bg-[#4F7D55]/15 text-[#4F7D55] border border-[#4F7D55]/30' : 'bg-[#C18A32]/15 text-[#C18A32]'
                        }`}>
                        {g.isVerified ? 'Linked ✓' : 'Pending OTP'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Real SOS Incident Logs from DB */}
            <div className="premium-panel p-6 rounded-[28px] border border-[#DCDDD5] bg-white shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-5 w-5 text-[#7A8E72]" />
                  <h2 className="font-headline text-xl font-bold text-[#28302A]">Recent SOS Logs</h2>
                </div>
                <button
                  onClick={fetchSosHistory}
                  className="p-1.5 rounded-lg hover:bg-[#FAF0EA] text-[#687067] hover:text-[#28302A] transition"
                  title="Refresh Logs"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {isLoadingLogs ? (
                  <div className="p-4 text-center text-xs text-[#687067]">Loading incident records...</div>
                ) : logs.length === 0 ? (
                  <div className="p-5 text-center text-xs text-[#687067] rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5]">
                    No past SOS alerts recorded. You are fully secure.
                  </div>
                ) : (
                  logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#28302A] text-xs leading-snug">{log.action}</p>
                        <p className="mt-1 text-[11px] text-[#687067]">{log.time}</p>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#DCDDD5] ${log.statusColor}`}>
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

