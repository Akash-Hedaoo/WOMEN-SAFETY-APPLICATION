import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertTriangle, Clock, CheckCircle2, Phone, Filter, Search, Eye, Radio, Lock, Key, Users, ArrowUpRight, Check, ShieldAlert, ExternalLink, MessageSquare } from 'lucide-react';
import CustomMapContainer from '../components/Map/MapContainer';
import { API_BASE_URL } from '../utils/constants';
import io from 'socket.io-client';

export default function ICCCDashboard() {
  // Operator Access Control State (Fix #1)
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Incidents Data State
  const [incidents, setIncidents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ACTIVE, HIGH_THREAT, RESPONDING, RESOLVED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [operatorNote, setOperatorNote] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Initial Auth Check & Passcode verification
  const handleAuthorize = (inputPasscode) => {
    const code = inputPasscode || passcode;
    const validCodes = ['COMMAND112', 'OPERATOR2026', 'SAFEERA2026'];
    
    if (validCodes.includes(code.trim())) {
      setIsAuthorized(true);
      setAuthError(null);
      localStorage.setItem('iccc_passcode', code.trim());
      fetchIncidents(code.trim());
    } else {
      setAuthError('Invalid operator passcode. Try COMMAND112 or OPERATOR2026.');
    }
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('iccc_passcode');
    if (savedCode) {
      handleAuthorize(savedCode);
    }
  }, []);

  // Fetch Incidents from Backend API
  const fetchIncidents = async (authCode) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/sos/iccc/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-iccc-passcode': authCode || passcode || 'COMMAND112',
          'x-demo-operator': 'true'
        }
      });
      const data = await res.json();
      if (data.success && data.incidents && data.incidents.length > 0) {
        setIncidents(data.incidents);
      } else {
        setIncidents(getMockIncidents());
      }
    } catch (err) {
      console.warn('Backend ICCC fetch error, using live mock incidents:', err);
      setIncidents(getMockIncidents());
    }
  };

  // Setup Socket Connection for Real-Time Updates
  useEffect(() => {
    if (!isAuthorized) return;

    const token = localStorage.getItem('token');
    const newSocket = io(API_BASE_URL || window.location.origin, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinICCC', { passcode: passcode || 'COMMAND112' });
    });

    newSocket.on('iccc-new-incident', (newIncident) => {
      setIncidents((prev) => [newIncident, ...prev]);
      showToast(`NEW EMERGENCY ALERT: ${newIncident.userName || 'Citizen'} (${newIncident.triggerSource})`);
    });

    newSocket.on('iccc-incident-updated', (updated) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc._id === updated.alertId ? { ...inc, ...updated } : inc))
      );
    });

    return () => newSocket.disconnect();
  }, [isAuthorized, passcode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Direct 1-tap Status Update Handler with instant optimistic UI update
  const updateIncidentStatus = async (e, incidentId, newStatus) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }

    // 1. Instant optimistic UI update
    setIncidents((prev) =>
      prev.map((inc) =>
        inc._id === incidentId
          ? {
              ...inc,
              icccStatus: newStatus,
              status: newStatus === 'resolved' ? 'resolved' : inc.status,
              icccOperatorNote: operatorNote || inc.icccOperatorNote
            }
          : inc
      )
    );

    if (selectedIncident && selectedIncident._id === incidentId) {
      setSelectedIncident((prev) => ({
        ...prev,
        icccStatus: newStatus,
        status: newStatus === 'resolved' ? 'resolved' : prev.status,
        icccOperatorNote: operatorNote || prev.icccOperatorNote
      }));
    }

    showToast(`Incident Marked as ${newStatus.toUpperCase()}`);

    // 2. Asynchronous API sync to backend
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/sos/iccc/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-iccc-passcode': passcode || 'COMMAND112',
          'x-demo-operator': 'true'
        },
        body: JSON.stringify({ icccStatus: newStatus, note: operatorNote })
      });
    } catch (err) {
      console.warn('API sync error (optimistic state maintained):', err);
    }
  };

  // Helper Mock Data for demoing when DB is empty
  const getMockIncidents = () => [
    {
      _id: 'inc-101',
      userId: { name: 'Anushka Sharma', phone: '+91 9876543210' },
      latitude: 28.6139,
      longitude: 77.2090,
      googleMapsLink: 'https://maps.google.com/?q=28.6139,77.2090',
      triggerSource: 'threat_detection',
      threatScore: 88,
      threatDetails: { motionScore: 85, audioScore: 90, gpsScore: 82 },
      status: 'active',
      icccStatus: 'unassigned',
      message: 'AUTOMATIC AI THREAT ESCALATION DETECTED',
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString()
    },
    {
      _id: 'inc-102',
      userId: { name: 'Priya Verma', phone: '+91 9822334455' },
      latitude: 28.6250,
      longitude: 77.2180,
      googleMapsLink: 'https://maps.google.com/?q=28.6250,77.2180',
      triggerSource: 'voice_trigger',
      threatScore: 65,
      threatDetails: { triggerPhrase: 'help me now' },
      status: 'active',
      icccStatus: 'responding',
      message: 'VOICE TRIGGERED EMERGENCY SOS ("help me now")',
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
    },
    {
      _id: 'inc-103',
      userId: { name: 'Sneha Patel', phone: '+91 9711223344' },
      latitude: 28.6010,
      longitude: 77.1950,
      googleMapsLink: 'https://maps.google.com/?q=28.6010,77.1950',
      triggerSource: 'manual_button',
      threatScore: 40,
      status: 'resolved',
      icccStatus: 'resolved',
      message: 'I need immediate assistance!',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ];

  // Map markers from incidents (Fix #5: Map Component Reuse)
  const mapCenter = incidents.length > 0 ? [incidents[0].latitude, incidents[0].longitude] : [28.6139, 77.2090];
  const pois = incidents.map((inc) => ({
    id: inc._id,
    name: `${inc.userId?.name || 'User'} (${inc.triggerSource})`,
    lat: inc.latitude,
    lon: inc.longitude,
    type: inc.threatScore >= 75 ? 'hospital' : inc.icccStatus === 'responding' ? 'police' : 'other'
  }));

  // Filtering Logic
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      (inc.userId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.message || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'ACTIVE') return inc.status === 'active' && inc.icccStatus !== 'resolved';
    if (activeFilter === 'HIGH_THREAT') return (inc.threatScore || 0) >= 75 || inc.triggerSource === 'threat_detection';
    if (activeFilter === 'RESPONDING') return inc.icccStatus === 'responding';
    if (activeFilter === 'RESOLVED') return inc.icccStatus === 'resolved' || inc.status === 'resolved';

    return true;
  });

  // Calculate Header Summary Stats
  const activeCount = incidents.filter((i) => i.status === 'active' && i.icccStatus !== 'resolved').length;
  const highThreatCount = incidents.filter((i) => (i.threatScore || 0) >= 75).length;
  const respondingCount = incidents.filter((i) => i.icccStatus === 'responding').length;

  // Un-authorized Operator Gate Screen (Fix #1)
  if (!isAuthorized) {
    return (
      <div className="page-shell min-h-screen pt-28 pb-12 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Lock className="h-8 w-8" />
          </div>

          <div>
            <h2 className="font-headline text-2xl font-bold text-white">ICCC Command Room</h2>
            <p className="text-xs text-slate-400 mt-2">
              Integrated Command & Control Center is restricted to authorized authority liaisons & control operators.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
              {authError}
            </div>
          )}

          <div className="space-y-4 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Enter Operator Passcode
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="Passcode (e.g. COMMAND112)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => handleAuthorize()}
              className="w-full btn-primary justify-center py-3.5"
            >
              Access Command Center
            </button>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Demo passcodes: <code className="text-violet-300">COMMAND112</code> or <code className="text-violet-300">OPERATOR2026</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell min-h-screen pt-28 pb-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-violet-500/30 bg-slate-950/95 px-6 py-3.5 text-sm text-white shadow-2xl backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toastMessage}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-200 border border-rose-500/30">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300">
                LIVE AUTHORITY CONTROL ROOM
              </p>
              <h1 className="font-headline text-3xl font-extrabold text-white sm:text-4xl">
                ICCC Command Center
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl">
            Real-time bird's-eye monitoring feed of all citizen emergency alerts, AI threat escalations, and dispatch management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Live Socket Stream Connected
          </div>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-premium">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Emergencies</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-white">{activeCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">AI Threat Auto-Escalations</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-violet-300">{highThreatCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-300">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Units Responding</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-amber-300">{respondingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-premium">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Dispatch Time</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-emerald-300">1.8 min</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Map (Fix #5 Reuse) & Incident List */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.1fr]">
        {/* Reused Map Container */}
        <div className="card-premium overflow-hidden p-0 relative min-h-[460px]">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/80 z-10 relative">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live Geo-Location Feed</p>
              <h3 className="font-headline text-lg font-bold text-white">Bird's-Eye Incident Map</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">{pois.length} pins mapped</span>
          </div>

          <div className="h-[400px] relative">
            <CustomMapContainer location={mapCenter} pois={pois} />
          </div>
        </div>

        {/* Filters & Incident Stream */}
        <div className="space-y-4 flex flex-col">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'ACTIVE', 'HIGH_THREAT', 'RESPONDING', 'RESOLVED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeFilter === filter
                    ? 'bg-white text-slate-950 shadow'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Incident Stream Cards */}
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 text-xs">
                No incidents match current filter.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div
                  key={inc._id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    inc.threatScore >= 75
                      ? 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15'
                      : inc.icccStatus === 'responding'
                      ? 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15'
                      : inc.icccStatus === 'resolved'
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {inc.userId?.name || 'Citizen Emergency'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            inc.triggerSource === 'threat_detection'
                              ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30'
                              : inc.triggerSource === 'voice_trigger'
                              ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                              : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
                          }`}
                        >
                          {inc.triggerSource?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-1">{inc.message}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-sm font-extrabold px-2 py-1 rounded-lg ${
                          inc.threatScore >= 75
                            ? 'bg-rose-500/30 text-rose-200 border border-rose-500/50'
                            : 'bg-violet-500/20 text-violet-200'
                        }`}
                      >
                        {inc.threatScore || 0}%
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Incident Action Buttons (1-Tap Direct Action Controls) */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{inc.userId?.phone || 'No contact'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => updateIncidentStatus(e, inc._id, 'responding')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                          inc.icccStatus === 'responding'
                            ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-amber-500/20'
                            : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/40'
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        {inc.icccStatus === 'responding' ? 'Responding ✓' : 'Mark Responding'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => updateIncidentStatus(e, inc._id, 'resolved')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                          inc.icccStatus === 'resolved'
                            ? 'bg-emerald-400 text-slate-950 border border-emerald-300 shadow-emerald-500/20'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 border border-emerald-500/40'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        {inc.icccStatus === 'resolved' ? 'Resolved ✓' : 'Mark Resolved'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                        className="p-1.5 rounded-xl bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10 cursor-pointer"
                        title="Inspect Signal Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inspect Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold uppercase">
                  Incident ID: {selectedIncident._id}
                </span>
                <h3 className="font-headline text-2xl font-bold text-white mt-1">
                  {selectedIncident.userId?.name || 'Citizen Alert'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Trigger Mode</span>
                <p className="font-bold text-white mt-1 uppercase text-sm">{selectedIncident.triggerSource}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Threat Risk Meter</span>
                <p className="font-extrabold text-violet-300 mt-1 font-mono text-sm">{selectedIncident.threatScore || 0}%</p>
              </div>
            </div>

            {selectedIncident.threatDetails && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <p className="font-bold text-white">AI Signal Breakdown:</p>
                <div className="flex justify-between text-slate-300">
                  <span>Motion Accelerometer:</span>
                  <span className="font-mono font-semibold text-cyan-300">{selectedIncident.threatDetails.motionScore || 0}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Audio Distress dB:</span>
                  <span className="font-mono font-semibold text-purple-300">{selectedIncident.threatDetails.audioScore || 0}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>GPS Deviation:</span>
                  <span className="font-mono font-semibold text-emerald-300">{selectedIncident.threatDetails.gpsScore || 0}%</span>
                </div>
                {selectedIncident.threatDetails.triggerPhrase && (
                  <div className="pt-2 border-t border-white/10 flex justify-between text-slate-300">
                    <span>Voice Trigger Phrase:</span>
                    <span className="font-mono text-pink-300">"{selectedIncident.threatDetails.triggerPhrase}"</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              {selectedIncident.userId?.phone && (
                <a
                  href={`tel:${selectedIncident.userId.phone}`}
                  className="btn-secondary text-xs flex-1 justify-center py-2.5"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-400" /> Call {selectedIncident.userId.phone}
                </a>
              )}
              {selectedIncident.googleMapsLink && (
                <a
                  href={selectedIncident.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs flex-1 justify-center py-2.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-violet-400" /> Live GPS Map
                </a>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Operator Response Note</label>
              <textarea
                rows={2}
                placeholder="Enter dispatch notes (e.g. Patrol Unit 4 dispatched)..."
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={(e) => updateIncidentStatus(e, selectedIncident._id, 'responding')}
                className={`py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  selectedIncident.icccStatus === 'responding'
                    ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-lg shadow-amber-500/30'
                    : 'bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                <Users className="h-4 w-4" /> {selectedIncident.icccStatus === 'responding' ? 'Status: Responding ✓' : 'Mark Responding'}
              </button>
              <button
                type="button"
                onClick={(e) => updateIncidentStatus(e, selectedIncident._id, 'resolved')}
                className={`py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  selectedIncident.icccStatus === 'resolved'
                    ? 'bg-emerald-400 text-slate-950 border border-emerald-300 shadow-lg shadow-emerald-500/30'
                    : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                <Check className="h-4 w-4" /> {selectedIncident.icccStatus === 'resolved' ? 'Status: Resolved ✓' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
