import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, Edit3, Loader2,
  Plus, RefreshCw, Send, Shield, ShieldCheck, Trash2, UserPlus, X,
} from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem('authToken');

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/guardian${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const formatLastAlert = (dateStr) => {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl transition-all ${isError ? 'border-rose-400/30 bg-rose-900/80' : 'border-white/10 bg-slate-950/90'}`}>
      <span className="inline-flex items-center gap-2">
        {isError
          ? <AlertCircle className="h-4 w-4 text-rose-300" />
          : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
        {toast.message}
        <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
      </span>
    </div>
  );
}

// ─── OTP Verify Modal ────────────────────────────────────────────────────────

function OTPModal({ guardian, onClose, onVerified, showToast }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await apiFetch('/verify', {
        method: 'POST',
        body: JSON.stringify({ guardianId: guardian._id, otp }),
      });
      showToast({ message: `${guardian.guardianName} verified successfully!` });
      onVerified();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await apiFetch('/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ guardianId: guardian._id }),
      });
      showToast({ message: "New OTP sent to guardian's phone" });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="premium-panel-strong w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-2xl font-semibold text-white">Verify Guardian</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          An OTP was sent to <span className="text-violet-300 font-semibold">{guardian.guardianName}</span>&#39;s number
          ending in <span className="text-white font-mono">{guardian.guardianPhone?.slice(-4)}</span>.
          Ask them to share it with you.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            className="premium-input text-center tracking-[0.5em] text-2xl font-mono"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button
            type="submit"
            disabled={otp.length !== 6 || loading}
            className="btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loading ? 'Verifying…' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2"
          >
            {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ guardian, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({
    guardianName: guardian.guardianName,
    relation: guardian.relation,
    notes: guardian.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guardianName) return;
    setLoading(true);
    try {
      await apiFetch(`/${guardian._id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      showToast({ message: 'Guardian updated successfully' });
      onSaved();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="premium-panel-strong w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-2xl font-semibold text-white">Edit Guardian</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Name</label>
            <input
              className="premium-input"
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Phone (cannot be changed)</label>
            <input className="premium-input opacity-50 cursor-not-allowed" value={guardian.guardianPhone} readOnly />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Relationship</label>
            <select
              className="premium-select"
              value={form.relation}
              onChange={(e) => setForm({ ...form, relation: e.target.value })}
            >
              <option>Father</option><option>Mother</option><option>Brother</option>
              <option>Sister</option><option>Friend</option><option>Partner</option>
              <option>Colleague</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Notes (optional)</label>
            <input
              className="premium-input"
              placeholder="Add a note…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Guardian Card ───────────────────────────────────────────────────────────

function GuardianCard({ guardian, onEdit, onRemove, onVerify, showToast }) {
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleTestAlert = async () => {
    setTesting(true);
    try {
      const data = await apiFetch(`/${guardian._id}/test-alert`, { method: 'POST' });
      showToast({ message: data.message });
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Remove ${guardian.guardianName} from your network?`)) return;
    setRemoving(true);
    try {
      await apiFetch(`/${guardian._id}`, { method: 'DELETE' });
      showToast({ message: `${guardian.guardianName} removed` });
      onRemove(guardian._id);
    } catch (err) {
      showToast({ type: 'error', message: err.message });
      setRemoving(false);
    }
  };

  return (
    <div className="premium-panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold text-lg flex-shrink-0">
            {guardian.guardianName.charAt(0).toUpperCase()}
            {guardian.isVerified && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900">
                <ShieldCheck className="h-3 w-3 text-white" />
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{guardian.guardianName}</p>
            <p className="text-sm text-slate-400">
              +91 {guardian.guardianPhone} · {guardian.relation}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {guardian.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                  <Clock className="h-3 w-3" /> Pending verification
                </span>
              )}
              <span className="text-xs text-slate-500">· Last alert: {formatLastAlert(guardian.lastAlertedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!guardian.isVerified && (
            <button
              onClick={() => onVerify(guardian)}
              className="text-sm font-semibold text-violet-300 hover:text-white border border-violet-400/30 rounded-xl px-3 py-1.5 hover:bg-violet-500/10 transition-colors"
            >
              Enter OTP
            </button>
          )}
          {guardian.isVerified && (
            <button
              onClick={handleTestAlert}
              disabled={testing}
              className="text-sm font-semibold text-slate-300 hover:text-white border border-white/10 rounded-xl px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Test alert
            </button>
          )}
          <button
            onClick={() => onEdit(guardian)}
            className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-200 hover:bg-white/10 transition-colors"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-2.5 text-rose-100 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
            title="Remove"
          >
            {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const RELATIONSHIPS = ['Father', 'Mother', 'Brother', 'Sister', 'Friend', 'Partner', 'Colleague', 'Other'];
const MAX_GUARDIANS = 5;

export default function GuardianNetworkPage() {
  const [guardians, setGuardians] = useState([]);
  const [loadingGuardians, setLoadingGuardians] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [formData, setFormData] = useState({ guardianName: '', guardianPhone: '', relation: 'Friend' });
  const [addLoading, setAddLoading] = useState(false);

  const [editingGuardian, setEditingGuardian] = useState(null);
  const [verifyingGuardian, setVerifyingGuardian] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((t) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch guardians from backend
  const fetchGuardians = useCallback(async () => {
    setLoadingGuardians(true);
    setLoadError(null);
    try {
      const data = await apiFetch('/');
      // Backend returns { verified: [...], pending: [...] }
      setGuardians([...(data.verified || []), ...(data.pending || [])]);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingGuardians(false);
    }
  }, []);

  useEffect(() => { fetchGuardians(); }, [fetchGuardians]);

  // Escape key closes modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setEditingGuardian(null);
        setVerifyingGuardian(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.guardianName || !formData.guardianPhone) return;

    // Validate 10-digit Indian phone
    const phoneClean = formData.guardianPhone.replace(/\D/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      showToast({ type: 'error', message: 'Please enter a valid 10-digit Indian mobile number' });
      return;
    }

    setAddLoading(true);
    try {
      const data = await apiFetch('/', {
        method: 'POST',
        body: JSON.stringify({ ...formData, guardianPhone: phoneClean }),
      });
      showToast({ message: data.message || 'Guardian added! OTP sent to their number.' });
      setFormData({ guardianName: '', guardianPhone: '', relation: 'Friend' });
      fetchGuardians();
    } catch (err) {
      showToast({ type: 'error', message: err.message });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveFromList = (id) => {
    setGuardians((prev) => prev.filter((g) => g._id !== id));
  };

  const isLimitReached = guardians.length >= MAX_GUARDIANS;

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {verifyingGuardian && (
        <OTPModal
          guardian={verifyingGuardian}
          onClose={() => setVerifyingGuardian(null)}
          onVerified={() => { setVerifyingGuardian(null); fetchGuardians(); }}
          showToast={showToast}
        />
      )}

      {editingGuardian && (
        <EditModal
          guardian={editingGuardian}
          onClose={() => setEditingGuardian(null)}
          onSaved={() => { setEditingGuardian(null); fetchGuardians(); }}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Guardian network</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-5xl">Trusted circle management</h1>
          <p className="mt-3 text-slate-300">Manage the people who receive your safety updates and emergency alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="premium-chip w-fit">Slots: {guardians.length} / {MAX_GUARDIANS}</div>
          <button
            onClick={fetchGuardians}
            disabled={loadingGuardians}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loadingGuardians ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Add Guardian Form */}
        <div className="premium-panel-strong p-6 h-fit">
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-violet-200" />
            <h2 className="font-headline text-2xl font-semibold text-white">Add new guardian</h2>
          </div>

          {isLimitReached ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
              Limit reached ({MAX_GUARDIANS} guardians). Remove one to add another.
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Full name</label>
                <input
                  className="premium-input"
                  placeholder="Guardian's full name"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Phone number (10 digits, no country code)</label>
                <input
                  className="premium-input"
                  placeholder="9876543210"
                  value={formData.guardianPhone}
                  maxLength={10}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Relationship</label>
                <select
                  className="premium-select"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                >
                  {RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button
                className="btn-primary w-full justify-center disabled:opacity-50"
                type="submit"
                disabled={addLoading}
              >
                {addLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Plus className="h-4 w-4" />}
                {addLoading ? 'Adding…' : 'Add guardian'}
              </button>
            </form>
          )}

          <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-xs text-violet-200 space-y-1">
            <p className="font-semibold text-violet-100 flex items-center gap-1"><Shield className="h-3 w-3" /> How it works</p>
            <p>1. Add guardian&#39;s phone number</p>
            <p>2. An OTP is sent to their phone via SMS</p>
            <p>3. They share the OTP with you to verify</p>
            <p>4. Verified guardians receive SOS alerts</p>
          </div>
        </div>

        {/* Guardian List */}
        <div className="space-y-4">
          {loadingGuardians ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              <p>Loading your guardians…</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-center text-rose-200">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-400" />
              <p className="font-semibold">Failed to load guardians</p>
              <p className="text-sm mt-1 text-rose-300">{loadError}</p>
              <button onClick={fetchGuardians} className="mt-4 btn-secondary">Try again</button>
            </div>
          ) : guardians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 premium-panel">
              <UserPlus className="h-12 w-12 text-slate-600" />
              <p className="text-lg font-semibold text-slate-300">No guardians yet</p>
              <p className="text-sm text-center">Add your first trusted contact using the form on the left.</p>
            </div>
          ) : (
            <>
              {/* Verified section */}
              {guardians.filter(g => g.isVerified).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Verified ({guardians.filter(g => g.isVerified).length})
                  </p>
                  <div className="space-y-3">
                    {guardians.filter(g => g.isVerified).map((g) => (
                      <GuardianCard
                        key={g._id}
                        guardian={g}
                        onEdit={setEditingGuardian}
                        onRemove={handleRemoveFromList}
                        onVerify={setVerifyingGuardian}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pending section */}
              {guardians.filter(g => !g.isVerified).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2 mt-6">
                    <Clock className="h-3 w-3" /> Pending verification ({guardians.filter(g => !g.isVerified).length})
                  </p>
                  <div className="space-y-3">
                    {guardians.filter(g => !g.isVerified).map((g) => (
                      <GuardianCard
                        key={g._id}
                        guardian={g}
                        onEdit={setEditingGuardian}
                        onRemove={handleRemoveFromList}
                        onVerify={setVerifyingGuardian}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
