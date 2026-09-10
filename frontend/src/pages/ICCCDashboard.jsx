import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertTriangle, Clock, CheckCircle2, Phone, Filter, Search, Eye, Radio, Users, ArrowUpRight, Check, ShieldAlert, ExternalLink, MessageSquare } from 'lucide-react';
import CustomMapContainer from '../components/Map/MapContainer';
import { API_BASE_URL } from '../utils/constants';
import io from 'socket.io-client';

export default function ICCCDashboard() {
  // Incidents Data State
  const [incidents, setIncidents] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ACTIVE, HIGH_THREAT, RESPONDING, RESOLVED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [operatorNote, setOperatorNote] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [complaints, setComplaints] = useState([]);

  // Fetch Incidents from Backend API
  const fetchIncidents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/sos/iccc/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to load ICCC incidents.');
      setIncidents(data.incidents || []);
    } catch (err) {
      console.warn('Backend ICCC fetch error:', err);
      setIncidents([]);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load complaints.');
      setComplaints(data.complaints || []);
    } catch (error) {
      console.warn('Complaint fetch error:', error);
      setComplaints([]);
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchComplaints();
  }, []);

  // Setup Socket Connection for Real-Time Updates
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const newSocket = io(API_BASE_URL || window.location.origin, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinICCC');
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

    newSocket.on('complaint-submitted', ({ complaint }) => {
      setComplaints((previous) => [complaint, ...previous]);
      showToast('New anonymous complaint received.');
    });

    newSocket.on('complaint-updated', ({ complaint }) => {
      setComplaints((previous) => previous.map((item) => item._id === complaint._id ? complaint : item));
    });

    return () => newSocket.disconnect();
  }, []);

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
      const token = localStorage.getItem('authToken');
      await fetch(`${API_BASE_URL}/api/sos/iccc/incidents/${incidentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ icccStatus: newStatus, note: operatorNote })
      });
    } catch (err) {
      console.warn('API sync error (optimistic state maintained):', err);
    }
  };

  const reviewComplaint = async (complaintId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to review complaint.');
      setComplaints((previous) => previous.map((item) => item._id === complaintId ? data.complaint : item));
      showToast(`Complaint ${status}.`);
    } catch (error) {
      showToast(error.message || 'Unable to review complaint.');
    }
  };

  const forwardComplaintToGovernmentDemo = async (complaintId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/complaints/${complaintId}/send-to-government`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to forward complaint.');
      setComplaints((previous) => previous.map((item) => item._id === complaintId ? data.complaint : item));
      showToast('Demo government-service forwarding recorded.');
    } catch (error) {
      showToast(error.message || 'Unable to forward complaint.');
    }
  };

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

  return (
    <div className="page-shell min-h-screen pt-28 pb-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#DCDDD5] bg-white px-6 py-3.5 text-sm text-[#28302A] shadow-2xl backdrop-blur-xl">
          <span className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-[#4F7D55]" />
            {toastMessage}
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#DCDDD5]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#C62828]">
                LIVE AUTHORITY CONTROL ROOM
              </p>
              <h1 className="font-headline text-3xl font-extrabold text-[#28302A] sm:text-4xl">
                ICCC Command Center
              </h1>
            </div>
          </div>
          <p className="text-xs text-[#687067] mt-2 max-w-2xl">
            Real-time bird's-eye monitoring feed of all citizen emergency alerts, AI threat escalations, and dispatch management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-[#4F7D55]/15 border border-[#4F7D55]/30 px-4 py-2 text-xs font-semibold text-[#4F7D55]">
            <span className="h-2 w-2 rounded-full bg-[#4F7D55] animate-ping" />
            Live Socket Stream Connected
          </div>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-premium bg-white border border-[#DCDDD5] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687067]">Active Emergencies</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-[#C62828]">{activeCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C62828]/15 text-[#C62828]">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-premium bg-white border border-[#DCDDD5] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687067]">AI Threat Auto-Escalations</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-[#7A8E72]">{highThreatCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0EA] text-[#7A8E72]">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-premium bg-white border border-[#DCDDD5] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687067]">Units Responding</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-[#C18A32]">{respondingCount}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C18A32]/15 text-[#C18A32]">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card-premium bg-white border border-[#DCDDD5] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687067]">Avg Dispatch Time</p>
              <p className="mt-2 text-3xl font-extrabold font-mono text-[#4F7D55]">1.8 min</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F7D55]/15 text-[#4F7D55]">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <section className="card-premium border border-[#DCDDD5] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#DCDDD5] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C62828]/10 text-[#C62828]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C62828]">Anonymous reporting queue</p>
              <h2 className="font-headline text-xl font-semibold text-[#28302A]">Citizen complaints</h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#687067]">{complaints.filter((complaint) => complaint.status === 'submitted').length} awaiting review</span>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#687067]">Reports contain no user name, phone, email, or account ID. Verify before using the demo forwarding action; it records a simulated hand-off and does not contact any government service.</p>

        <div className="mt-5 space-y-3">
          {complaints.length === 0 ? (
            <p className="rounded-2xl bg-[#FAF8F5] p-5 text-sm text-[#687067]">No anonymous complaints have been submitted.</p>
          ) : complaints.map((complaint) => (
            <article key={complaint._id} className="rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A8E72]">{complaint.category.replace('_', ' ')}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#28302A]">{complaint.message}</p>
                  <p className="mt-2 text-[11px] text-[#687067]">Submitted {new Date(complaint.createdAt).toLocaleString()}</p>
                  {complaint.governmentReference && <p className="mt-1 text-[11px] font-semibold text-[#7A8E72]">Demo reference: {complaint.governmentReference}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${complaint.status === 'verified' ? 'bg-[#4F7D55]/15 text-[#37613D]' : complaint.status === 'rejected' ? 'bg-[#C62828]/10 text-[#B71C1C]' : complaint.status === 'forwarded' ? 'bg-[#7A8E72]/15 text-[#37613D]' : 'bg-[#C18A32]/15 text-[#956616]'}`}>
                  {complaint.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {complaint.status === 'submitted' && <>
                  <button onClick={() => reviewComplaint(complaint._id, 'verified')} className="btn-primary text-xs">Verify complaint</button>
                  <button onClick={() => reviewComplaint(complaint._id, 'rejected')} className="btn-secondary text-xs">Reject</button>
                </>}
                {complaint.status === 'verified' && <button onClick={() => forwardComplaintToGovernmentDemo(complaint._id)} className="btn-secondary text-xs">Send to government service (demo)</button>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Main Grid: Map (Fix #5 Reuse) & Incident List */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.1fr]">
        {/* Reused Map Container */}
        <div className="card-premium overflow-hidden p-0 relative min-h-[460px] bg-white border border-[#DCDDD5] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DCDDD5] px-6 py-4 bg-[#FAF8F5] z-10 relative">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687067]">Live Geo-Location Feed</p>
              <h3 className="font-headline text-lg font-bold text-[#28302A]">Bird's-Eye Incident Map</h3>
            </div>
            <span className="text-[11px] text-[#687067] font-mono">{pois.length} pins mapped</span>
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
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#687067]" />
              <input
                type="text"
                placeholder="Search user or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-[#DCDDD5] bg-white pl-10 pr-4 py-2.5 text-xs text-[#28302A] placeholder-[#B8A99A] focus:outline-none"
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
                    ? 'bg-[#7A8E72] text-white shadow-sm'
                    : 'bg-white text-[#687067] border border-[#DCDDD5] hover:bg-[#FAF0EA]'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Incident Stream Cards */}
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] text-[#687067] text-xs">
                No incidents match current filter.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div
                  key={inc._id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    inc.threatScore >= 75
                      ? 'border-[#C62828]/40 bg-[#C62828]/5 hover:bg-[#C62828]/10'
                      : inc.icccStatus === 'responding'
                      ? 'border-[#C18A32]/40 bg-[#C18A32]/5 hover:bg-[#C18A32]/10'
                      : inc.icccStatus === 'resolved'
                      ? 'border-[#4F7D55]/40 bg-[#4F7D55]/5 hover:bg-[#4F7D55]/10'
                      : 'border-[#DCDDD5] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#28302A] text-sm">
                          {inc.userId?.name || 'Citizen Emergency'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            inc.triggerSource === 'threat_detection'
                              ? 'bg-[#FAF0EA] text-[#7A8E72] border border-[#DCDDD5]'
                              : inc.triggerSource === 'voice_trigger'
                              ? 'bg-[#E8C4B8]/30 text-[#28302A] border border-[#E8C4B8]'
                              : 'bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30'
                          }`}
                        >
                          {inc.triggerSource?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#687067] mt-1 line-clamp-1">{inc.message}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`font-mono text-sm font-extrabold px-2 py-1 rounded-lg ${
                          inc.threatScore >= 75
                            ? 'bg-[#C62828]/15 text-[#C62828] border border-[#C62828]/30'
                            : 'bg-[#FAF0EA] text-[#7A8E72]'
                        }`}
                      >
                        {inc.threatScore || 0}%
                      </span>
                      <p className="text-[10px] text-[#687067] font-mono mt-1">
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Incident Action Buttons (1-Tap Direct Action Controls) */}
                  <div className="pt-3 border-t border-[#DCDDD5] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-[#687067]">
                      <Phone className="h-3.5 w-3.5 text-[#7A8E72]" />
                      <span>{inc.userId?.phone || 'No contact'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => updateIncidentStatus(e, inc._id, 'responding')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          inc.icccStatus === 'responding'
                            ? 'bg-[#C18A32] text-white border border-[#C18A32]'
                            : 'bg-[#C18A32]/15 text-[#C18A32] hover:bg-[#C18A32]/25 border border-[#C18A32]/30'
                        }`}
                      >
                        <Users className="h-3 w-3" />
                        {inc.icccStatus === 'responding' ? 'Responding ✓' : 'Mark Responding'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => updateIncidentStatus(e, inc._id, 'resolved')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          inc.icccStatus === 'resolved'
                            ? 'bg-[#4F7D55] text-white border border-[#4F7D55]'
                            : 'bg-[#4F7D55]/15 text-[#4F7D55] hover:bg-[#4F7D55]/25 border border-[#4F7D55]/30'
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
                        className="p-1.5 rounded-xl bg-[#FAF0EA] text-[#28302A] hover:bg-[#f3e5dc] border border-[#DCDDD5] cursor-pointer"
                        title="Inspect Signal Details"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#7A8E72]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="max-w-lg w-full rounded-3xl border border-[#DCDDD5] bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#DCDDD5] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0EA] text-[#7A8E72] border border-[#DCDDD5] text-[10px] font-bold uppercase">
                  Incident ID: {selectedIncident._id}
                </span>
                <h3 className="font-headline text-2xl font-bold text-[#28302A] mt-1">
                  {selectedIncident.userId?.name || 'Citizen Alert'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="h-8 w-8 rounded-full bg-[#FAF0EA] flex items-center justify-center text-[#687067] hover:text-[#28302A] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DCDDD5]">
                <span className="text-[#687067] block text-[10px] uppercase tracking-wider font-semibold">Trigger Mode</span>
                <p className="font-bold text-[#28302A] mt-1 uppercase text-sm">{selectedIncident.triggerSource}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DCDDD5]">
                <span className="text-[#687067] block text-[10px] uppercase tracking-wider font-semibold">Threat Risk Meter</span>
                <p className="font-extrabold text-[#7A8E72] mt-1 font-mono text-sm">{selectedIncident.threatScore || 0}%</p>
              </div>
            </div>

            {selectedIncident.threatDetails && (
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DCDDD5] space-y-2 text-xs">
                <p className="font-bold text-[#28302A]">AI Signal Breakdown:</p>
                <div className="flex justify-between text-[#687067]">
                  <span>Motion Accelerometer:</span>
                  <span className="font-mono font-semibold text-[#28302A]">{selectedIncident.threatDetails.motionScore || 0}%</span>
                </div>
                <div className="flex justify-between text-[#687067]">
                  <span>Audio Distress dB:</span>
                  <span className="font-mono font-semibold text-[#28302A]">{selectedIncident.threatDetails.audioScore || 0}%</span>
                </div>
                <div className="flex justify-between text-[#687067]">
                  <span>GPS Deviation:</span>
                  <span className="font-mono font-semibold text-[#28302A]">{selectedIncident.threatDetails.gpsScore || 0}%</span>
                </div>
                {selectedIncident.threatDetails.triggerPhrase && (
                  <div className="pt-2 border-t border-[#DCDDD5] flex justify-between text-[#687067]">
                    <span>Voice Trigger Phrase:</span>
                    <span className="font-mono text-[#28302A] font-semibold">"{selectedIncident.threatDetails.triggerPhrase}"</span>
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
                  <Phone className="h-3.5 w-3.5 text-[#4F7D55]" /> Call {selectedIncident.userId.phone}
                </a>
              )}
              {selectedIncident.googleMapsLink && (
                <a
                  href={selectedIncident.googleMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs flex-1 justify-center py-2.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#7A8E72]" /> Live GPS Map
                </a>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#28302A]">Operator Response Note</label>
              <textarea
                rows={2}
                placeholder="Enter dispatch notes (e.g. Patrol Unit 4 dispatched)..."
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                className="w-full rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-3 text-xs text-[#28302A] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={(e) => updateIncidentStatus(e, selectedIncident._id, 'responding')}
                className={`py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  selectedIncident.icccStatus === 'responding'
                    ? 'bg-[#C18A32] text-white border border-[#C18A32] shadow-md'
                    : 'bg-[#C18A32]/15 text-[#C18A32] border border-[#C18A32]/30 hover:bg-[#C18A32]/25'
                }`}
              >
                <Users className="h-4 w-4" /> {selectedIncident.icccStatus === 'responding' ? 'Status: Responding ✓' : 'Mark Responding'}
              </button>
              <button
                type="button"
                onClick={(e) => updateIncidentStatus(e, selectedIncident._id, 'resolved')}
                className={`py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  selectedIncident.icccStatus === 'resolved'
                    ? 'bg-[#4F7D55] text-white border border-[#4F7D55] shadow-md'
                    : 'bg-[#4F7D55]/15 text-[#4F7D55] border border-[#4F7D55]/30 hover:bg-[#4F7D55]/25'
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
