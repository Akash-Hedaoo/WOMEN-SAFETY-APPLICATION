import React from 'react';

export default function StatsCard({ title, value, icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-violet-500/20 text-violet-200',
    secondary: 'bg-pink-500/20 text-pink-200',
    accent: 'bg-cyan-500/20 text-cyan-100',
    error: 'bg-rose-500/20 text-rose-100',
  };

  return (
    <div className="premium-panel flex items-start gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorMap[color]}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-slate-400">{title}</p>
        <p className="mt-1 font-headline text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
