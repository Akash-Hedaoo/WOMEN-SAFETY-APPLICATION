import React from 'react';

export default function StatsCard({ title, value, icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-[#A8B8A0]/25 text-[#7A8E72]',
    secondary: 'bg-[#E8C4B8]/30 text-[#28302A]',
    accent: 'bg-[#B8A99A]/25 text-[#28302A]',
    error: 'bg-[#C62828]/15 text-[#C62828]',
  };

  return (
    <div className="premium-panel flex items-start gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorMap[color]}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-[#687067]">{title}</p>
        <p className="mt-1 font-headline text-2xl font-semibold text-[#28302A]">{value}</p>
      </div>
    </div>
  );
}
