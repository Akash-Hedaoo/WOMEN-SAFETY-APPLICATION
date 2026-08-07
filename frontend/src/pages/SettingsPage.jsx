import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Download, Key, Lock, LogOut, Monitor, Smartphone, Shield, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(localStorage.getItem('settingsTab') || 'Profile');
  const [toast, setToast] = useState(null);
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [notifPrefs, setNotifPrefs] = useState({ sos: true, safezone: true, guardian: false, news: true });
  const [locationPrefs, setLocationPrefs] = useState({ background: true, sosOnly: false, improveMap: true });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => localStorage.setItem('settingsTab', activeTab), [activeTab]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const TABS = [
    { name: 'Profile', icon: User },
    { name: 'Notifications', icon: Bell },
    { name: 'Privacy & Security', icon: Shield },
    { name: 'Connected Devices', icon: Smartphone },
  ];

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">{toast}</div>}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="premium-panel-strong w-full max-w-md p-6">
            <div className="mb-4 rounded-2xl bg-rose-500/10 p-3 text-rose-100 inline-flex">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="font-headline text-2xl font-semibold text-white">Delete account</h3>
            <p className="mt-3 text-sm text-slate-300">This action is permanent and cannot be undone.</p>
            <input className="premium-input mt-5" placeholder="Type DELETE" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button disabled={deleteConfirmText !== 'DELETE'} className="btn-danger flex-1 disabled:opacity-50">Delete forever</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Settings</p>
        <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-5xl">Account preferences</h1>
        <p className="mt-3 text-slate-300">Profile, notifications, privacy, and connected devices.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.name;
            return (
              <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition ${active ? 'bg-white text-slate-950' : 'bg-white/6 text-slate-200 hover:bg-white/10'}`}>
                <span className="flex items-center gap-3"><Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-violet-200'}`} />{tab.name}</span>
                {active && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
          <button className="btn-danger w-full justify-center"><LogOut className="h-4 w-4" /> Logout</button>
        </aside>

        <main className="premium-panel-strong p-6 md:p-8">
          {activeTab === 'Profile' && (
            <div className="space-y-6">
              <h2 className="font-headline text-2xl font-semibold text-white">Personal information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="premium-input" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} placeholder="Full name" />
                <input className="premium-input" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} placeholder="Email address" />
                <input className="premium-input md:col-span-2" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <button className="btn-primary">Save changes</button>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-6">
              <h2 className="font-headline text-2xl font-semibold text-white">Notification preferences</h2>
              {Object.entries(notifPrefs).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <span className="capitalize">{key}</span>
                  <input type="checkbox" checked={value} onChange={() => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }))} />
                </label>
              ))}
              <button className="btn-primary">Save preferences</button>
            </div>
          )}

          {activeTab === 'Privacy & Security' && (
            <div className="space-y-6">
              <h2 className="font-headline text-2xl font-semibold text-white">Privacy & security</h2>
              {Object.entries(locationPrefs).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <span className="capitalize">{key}</span>
                  <input type="checkbox" checked={value} onChange={() => setLocationPrefs((p) => ({ ...p, [key]: !p[key] }))} />
                </label>
              ))}
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setIsDownloading(true)} className="btn-secondary"><Download className="h-4 w-4" /> {isDownloading ? 'Preparing…' : 'Download my data'}</button>
                <button onClick={() => setShowDeleteModal(true)} className="btn-danger">Delete account</button>
              </div>
            </div>
          )}

          {activeTab === 'Connected Devices' && (
            <div className="space-y-4">
              <h2 className="font-headline text-2xl font-semibold text-white">Connected devices</h2>
              {[
                { id: 1, device: 'iPhone 14', status: 'Connected now' },
                { id: 2, device: 'MacBook Pro', status: 'Last seen 2 hours ago' },
              ].map((device) => (
                <div key={device.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="font-semibold text-white">{device.device}</p>
                    <p className="text-sm text-slate-400">{device.status}</p>
                  </div>
                  <button className="btn-secondary">Sign out</button>
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">Pairing and device flows keep the same backend contract and local persistence model.</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
