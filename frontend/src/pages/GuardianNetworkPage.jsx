import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, CheckCircle2, Edit3, Loader2,
  Plus, RefreshCw, Send, Shield, ShieldCheck, Trash2, UserPlus, X,
} from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';
import { syncGuardians } from '../services/guardianCacheService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getToken = () => (
  localStorage.getItem('authToken')
  || localStorage.getItem('token')
  || localStorage.getItem('accessToken')
);

const normalizeIndianMobile = (value) => {
  const digits = value.replace(/\D/g, '');
  // Treat +91/91 as a country code only when all 12 digits were supplied.
  // A valid Indian mobile number can itself begin with 91.
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

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
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.code === 'TOKEN_EXPIRED') {
    ['authToken', 'token', 'accessToken', 'refreshToken', 'user'].forEach((key) => localStorage.removeItem(key));
    throw new Error('SESSION_EXPIRED');
  }
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
    <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-5 py-3 text-sm shadow-2xl backdrop-blur-xl transition-all ${isError ? 'border-[#C62828]/30 bg-[#C62828] text-white' : 'border-[#DCDDD5] bg-white text-[#28302A]'}`}>
      <span className="inline-flex items-center gap-2">
        {isError
          ? <AlertCircle className="h-4 w-4 text-white" />
          : <CheckCircle2 className="h-4 w-4 text-[#4F7D55]" />}
        {toast.message}
        <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X className="h-3 w-3" /></button>
      </span>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ guardian, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({
    guardianName: guardian.guardianName,
    guardianEmail: guardian.guardianEmail || '',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="premium-panel-strong w-full max-w-xl p-6 bg-white border border-[#DCDDD5] shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-2xl font-semibold text-[#28302A]">Edit Guardian</h3>
          <button onClick={onClose} className="text-[#687067] hover:text-[#28302A]"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#687067] mb-1 block">Name</label>
            <input
              className="premium-input"
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-[#687067] mb-1 block">Phone (cannot be changed)</label>
            <input className="premium-input opacity-60 cursor-not-allowed bg-[#FAF8F5]" value={guardian.guardianPhone} readOnly />
          </div>
          <div>
            <label className="text-xs text-[#687067] mb-1 block">Email address</label>
            <input className="premium-input" type="email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-[#687067] mb-1 block">Relationship</label>
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
            <label className="text-xs text-[#687067] mb-1 block">Notes (optional)</label>
            <input
              className="premium-input"
              placeholder="Add a note…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
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

function GuardianCard({ guardian, onEdit, onRemove, showToast }) {
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
    <div className="premium-panel p-5 bg-white border border-[#DCDDD5] shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF0EA] text-[#7A8E72] border border-[#DCDDD5] font-semibold text-lg flex-shrink-0">
            {guardian.guardianName.charAt(0).toUpperCase()}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F7D55] ring-2 ring-white"><ShieldCheck className="h-3 w-3 text-white" /></span>
          </div>
          <div>
            <p className="font-semibold text-[#28302A]">{guardian.guardianName}</p>
            <p className="text-sm text-[#687067]">
              +91 {guardian.guardianPhone} · {guardian.relation}
            </p>
            <p className="text-sm text-[#687067]">{guardian.guardianEmail}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-[#4F7D55] font-medium"><ShieldCheck className="h-3 w-3" /> Active guardian</span>
              <span className="text-xs text-[#B8A99A]">· Last alert: {formatLastAlert(guardian.lastAlertedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
              onClick={handleTestAlert}
              disabled={testing}
              className="text-sm font-semibold text-[#687067] hover:text-[#28302A] border border-[#DCDDD5] rounded-xl px-3 py-1.5 hover:bg-[#FAF8F5] transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 text-[#7A8E72]" />}
              Test alert
            </button>
          <button
            onClick={() => onEdit(guardian)}
            className="rounded-2xl border border-[#DCDDD5] bg-white p-2.5 text-[#687067] hover:text-[#28302A] hover:bg-[#FAF8F5] transition-colors shadow-sm"
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="rounded-2xl border border-[#C62828]/20 bg-[#C62828]/10 p-2.5 text-[#C62828] hover:bg-[#C62828]/20 transition-colors disabled:opacity-50"
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
  const navigate = useNavigate();
  const [guardians, setGuardians] = useState([]);
  const [loadingGuardians, setLoadingGuardians] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [formData, setFormData] = useState({ guardianName: '', guardianPhone: '', guardianEmail: '', relation: 'Friend' });
  const [addLoading, setAddLoading] = useState(false);

  const [editingGuardian, setEditingGuardian] = useState(null);
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
      setGuardians(data.guardians || []);
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        navigate('/login', { replace: true, state: { message: 'Your session expired. Please sign in again.' } });
        return;
      }
      setLoadError(err.message);
    } finally {
      setLoadingGuardians(false);
    }
  }, [navigate]);

  useEffect(() => { fetchGuardians(); }, [fetchGuardians]);

  // Escape key closes modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setEditingGuardian(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.guardianName || !formData.guardianPhone || !formData.guardianEmail) return;

    // Validate 10-digit Indian phone
    const phoneClean = normalizeIndianMobile(formData.guardianPhone);
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
      showToast({ message: data.message || 'Guardian added and activated.' });
      setFormData({ guardianName: '', guardianPhone: '', guardianEmail: '', relation: 'Friend' });
      await Promise.all([fetchGuardians(), syncGuardians()]);
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">Guardian network</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-[#28302A] md:text-5xl">Trusted circle management</h1>
          <p className="mt-3 text-[#687067]">Manage the people who receive your safety updates and emergency alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="premium-chip w-fit bg-white border border-[#DCDDD5] text-[#28302A]">Slots: {guardians.length} / {MAX_GUARDIANS}</div>
          <button
            onClick={fetchGuardians}
            disabled={loadingGuardians}
            className="rounded-xl border border-[#DCDDD5] bg-white p-2 text-[#687067] hover:text-[#28302A] hover:bg-[#FAF8F5] disabled:opacity-50 shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loadingGuardians ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Add Guardian Form */}
        <div className="premium-panel-strong p-6 h-fit bg-white border border-[#DCDDD5] shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-[#7A8E72]" />
            <h2 className="font-headline text-2xl font-semibold text-[#28302A]">Add new guardian</h2>
          </div>

          {isLimitReached ? (
            <div className="rounded-2xl border border-[#C62828]/20 bg-[#C62828]/10 p-4 text-sm text-[#C62828]">
              Limit reached ({MAX_GUARDIANS} guardians). Remove one to add another.
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-[#687067] mb-1 block">Full name</label>
                <input
                  className="premium-input"
                  placeholder="Guardian's full name"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#687067] mb-1 block">Phone number (10 digits; +91 is optional)</label>
                <input
                  className="premium-input"
                  placeholder="9876543210 or 919876543210"
                  value={formData.guardianPhone}
                  maxLength={12}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#687067] mb-1 block">Email address</label>
                <input
                  className="premium-input"
                  type="email"
                  placeholder="guardian@example.com"
                  value={formData.guardianEmail}
                  onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#687067] mb-1 block">Relationship</label>
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

          <div className="mt-6 rounded-2xl border border-[#A8B8A0]/30 bg-[#A8B8A0]/10 p-4 text-xs text-[#28302A] space-y-1">
            <p className="font-semibold text-[#28302A] flex items-center gap-1"><Shield className="h-3 w-3 text-[#7A8E72]" /> How it works</p>
            <p>1. Add guardian&#39;s phone number</p>
            <p>2. Add their email address</p>
            <p>3. They are active immediately and receive SOS alerts by SMS and email</p>
          </div>
        </div>

        {/* Guardian List */}
        <div className="space-y-4">
          {loadingGuardians ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#687067] gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#7A8E72]" />
              <p>Loading your guardians…</p>
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-[#C62828]/20 bg-[#C62828]/10 p-6 text-center text-[#C62828]">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-[#C62828]" />
              <p className="font-semibold">Failed to load guardians</p>
              <p className="text-sm mt-1 text-[#C62828]">{loadError}</p>
              <button onClick={fetchGuardians} className="mt-4 btn-secondary">Try again</button>
            </div>
          ) : guardians.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#687067] gap-3 premium-panel bg-white border border-[#DCDDD5]">
              <UserPlus className="h-12 w-12 text-[#B8A99A]" />
              <p className="text-lg font-semibold text-[#28302A]">No guardians yet</p>
              <p className="text-sm text-center">Add your first trusted contact using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guardians.map((guardian) => (
                <GuardianCard key={guardian._id} guardian={guardian} onEdit={setEditingGuardian} onRemove={handleRemoveFromList} showToast={showToast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
