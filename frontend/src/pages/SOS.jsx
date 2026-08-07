import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ShieldAlert, Users, Phone, X } from 'lucide-react';

export default function SOSPage() {
  const [stage, setStage] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const guardians = [
    { id: 1, name: 'Appa', initial: 'A', color: 'bg-violet-500', status: 'Active ✓' },
    { id: 2, name: 'Ishaan', initial: 'I', color: 'bg-cyan-500', status: 'Pending' },
  ];

  const logs = [
    { id: 1, action: 'Safe route started', time: 'Oct 22, 08:45 PM', status: 'Completed' },
    { id: 2, action: 'Guardian added', time: 'Oct 20, 02:15 PM', status: 'Verified' },
  ];

  useEffect(() => {
    let timer;
    if (stage === 'confirming') {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setStage('active');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    let timer;
    if (stage === 'active') {
      timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [stage]);

  const handleSOSClick = () => {
    if (stage === 'idle') setStage('confirming');
    else if (stage === 'confirming') setStage('cancelled');
  };

  const handleCancelSOS = () => {
    setStage('cancelled');
    setCountdown(3);
    setElapsed(0);
    setToastMessage('SOS alert cancelled successfully');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTestAlert = () => {
    setToastMessage('Test alert sent successfully');
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div className="page-shell min-h-screen pt-28 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {toastMessage}
          </span>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mb-8 rounded-[28px] border px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.26em] ${stage === 'active' ? 'border-rose-400/20 bg-rose-500/15 text-rose-100' : 'border-white/10 bg-white/6 text-slate-300'}`}>
          {stage === 'idle' && 'You are safe · background tracking on'}
          {stage === 'confirming' && 'Preparing alert · tap again to cancel'}
          {stage === 'active' && 'Alert active · notifying guardians'}
          {stage === 'cancelled' && 'Alert cancelled'}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <section className="premium-panel-strong p-6 md:p-8">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="relative flex items-center justify-center">
                {stage !== 'active' && (
                  <div className="absolute h-72 w-72 rounded-full bg-rose-500/15 blur-3xl" />
                )}
                <button
                  onClick={handleSOSClick}
                  disabled={stage === 'active' || stage === 'cancelled'}
                  className={`relative flex h-64 w-64 items-center justify-center rounded-full border shadow-2xl transition-transform ${
                    stage === 'idle' ? 'border-rose-300/30 bg-gradient-to-br from-rose-500 to-pink-600 hover:scale-[1.02]' : ''
                  } ${stage === 'confirming' ? 'border-amber-300/30 bg-gradient-to-br from-amber-400 to-orange-500' : ''} ${stage === 'active' ? 'border-white/10 bg-gradient-to-br from-slate-950 to-rose-600' : ''} ${stage === 'cancelled' ? 'border-emerald-300/30 bg-gradient-to-br from-emerald-500 to-emerald-600' : ''}`}
                >
                  {stage === 'idle' && (
                    <div className="space-y-3 text-white">
                      <ShieldAlert className="mx-auto h-16 w-16" />
                      <div className="text-5xl font-semibold tracking-tight">SOS</div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] opacity-80">Press for emergency</p>
                    </div>
                  )}
                  {stage === 'confirming' && <div className="text-7xl font-semibold text-white">{countdown}</div>}
                  {stage === 'active' && (
                    <div className="space-y-3 text-white">
                      <Clock className="mx-auto h-10 w-10 opacity-80" />
                      <div className="font-mono text-4xl font-semibold">{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-100">Alert active</p>
                    </div>
                  )}
                  {stage === 'cancelled' && (
                    <div className="space-y-3 text-white">
                      <CheckCircle2 className="mx-auto h-16 w-16" />
                      <p className="text-sm font-semibold uppercase tracking-[0.22em]">Safe</p>
                    </div>
                  )}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={handleTestAlert} className="btn-secondary">Test alert</button>
                <button onClick={handleCancelSOS} className="btn-danger">Cancel alert</button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="premium-panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-violet-200" />
                <h2 className="font-headline text-2xl font-semibold text-white">Guardians</h2>
              </div>
              <div className="space-y-3">
                {guardians.map((guardian) => (
                  <div key={guardian.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white ${guardian.color}`}>{guardian.initial}</div>
                      <div>
                        <p className="font-semibold text-white">{guardian.name}</p>
                        <p className="text-xs text-slate-400">{guardian.status}</p>
                      </div>
                    </div>
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-panel p-6">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-violet-200" />
                <h2 className="font-headline text-2xl font-semibold text-white">Recent logs</h2>
              </div>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-semibold text-white">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-400">{log.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
