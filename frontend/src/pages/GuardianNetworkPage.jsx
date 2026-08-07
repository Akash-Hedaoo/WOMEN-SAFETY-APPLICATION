import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Edit3, Plus, Shield, Trash2, UserPlus } from 'lucide-react';

function VerificationButton({ guardian, onVerify }) {
  const [status, setStatus] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);

  const handleClick = () => {
    setStatus('verifying');
    setTimeout(() => {
      onVerify(guardian);
      setStatus('cooldown');
      setTimeLeft(60);
    }, 1500);
  };

  useEffect(() => {
    if (status === 'cooldown' && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
    if (status === 'cooldown' && timeLeft === 0) setStatus('idle');
  }, [status, timeLeft]);

  if (status === 'verifying') return <span className="text-sm font-semibold text-violet-200">Sending…</span>;
  if (status === 'cooldown') return <span className="text-sm font-semibold text-slate-400">Resend ({timeLeft}s)</span>;
  return (
    <button onClick={handleClick} className="text-sm font-semibold text-violet-200 hover:text-white">
      Send verification
    </button>
  );
}

export default function GuardianNetworkPage() {
  const [guardians, setGuardians] = useState([
    { id: 1, name: 'Appa', phone: '+91 9823456781', relationship: 'Appa', verified: true, lastAlert: '2 days ago' },
    { id: 2, name: 'Ishaan', phone: '+91 9876543211', relationship: 'Friend', verified: true, lastAlert: 'Never' },
    { id: 3, name: 'Nimrat', phone: '+91 9876543212', relationship: 'Behen', verified: false, lastAlert: 'Never' },
  ]);
  const [formData, setFormData] = useState({ name: '', phone: '', relationship: 'Friend' });
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [toast, setToast] = useState(null);
  const MAX_GUARDIANS = 5;
  const isLimitReached = guardians.length >= MAX_GUARDIANS;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && setEditingGuardian(null);
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const showToast = (message) => setToast(message);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || isLimitReached) return;
    setGuardians([...guardians, { id: Date.now(), ...formData, verified: false, lastAlert: 'Never' }]);
    setFormData({ name: '', phone: '', relationship: 'Friend' });
    showToast('Guardian added successfully');
  };

  const removeGuardian = (id) => {
    setGuardians(guardians.filter((g) => g.id !== id));
    showToast('Guardian removed');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingGuardian.name || !editingGuardian.phone) return;
    setGuardians(guardians.map((g) => (g.id === editingGuardian.id ? editingGuardian : g)));
    setEditingGuardian(null);
    showToast('Guardian updated successfully');
  };

  const handleVerifySuccess = (guardian) => showToast(`Verification SMS sent to ${guardian.phone}`);

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toast}
          </span>
        </div>
      )}

      {editingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="premium-panel-strong w-full max-w-xl p-6">
            <h3 className="font-headline text-2xl font-semibold text-white">Edit Guardian</h3>
            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
              <input className="premium-input" value={editingGuardian.name} onChange={(e) => setEditingGuardian({ ...editingGuardian, name: e.target.value })} />
              <input className="premium-input" value={editingGuardian.phone} onChange={(e) => setEditingGuardian({ ...editingGuardian, phone: e.target.value })} />
              <select className="premium-select" value={editingGuardian.relationship} onChange={(e) => setEditingGuardian({ ...editingGuardian, relationship: e.target.value })}>
                <option>Appa</option><option>Ammi</option><option>Behen</option><option>Bhai</option><option>Dost</option><option>Partner</option><option>Other</option>
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingGuardian(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Guardian network</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-5xl">Trusted circle management</h1>
          <p className="mt-3 text-slate-300">Manage the people who receive your safety updates and emergency alerts.</p>
        </div>
        <div className="premium-chip w-fit">Slots used: {guardians.length} / {MAX_GUARDIANS}</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="premium-panel-strong p-6">
          <div className="mb-5 flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-violet-200" />
            <h2 className="font-headline text-2xl font-semibold text-white">Add new guardian</h2>
          </div>
          {isLimitReached ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">Limit reached. Upgrade to Premium for unlimited guardians.</div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <input className="premium-input" placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input className="premium-input" placeholder="+91 phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <select className="premium-select" value={formData.relationship} onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}>
                <option>Appa</option><option>Ammi</option><option>Behen</option><option>Bhai</option><option>Dost</option><option>Partner</option><option>Other</option>
              </select>
              <button className="btn-primary w-full justify-center" type="submit"><Plus className="h-4 w-4" /> Add guardian</button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          {guardians.map((guardian) => (
            <div key={guardian.id} className="premium-panel p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold">
                    {guardian.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{guardian.name}</p>
                    <p className="text-sm text-slate-400">{guardian.phone} · {guardian.relationship}</p>
                    <p className="text-xs text-slate-500">Last alert: {guardian.lastAlert}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <VerificationButton guardian={guardian} onVerify={handleVerifySuccess} />
                  <button onClick={() => setEditingGuardian(guardian)} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 hover:bg-white/10"><Edit3 className="h-4 w-4" /></button>
                  <button onClick={() => removeGuardian(guardian.id)} className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-rose-100 hover:bg-rose-500/20"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
