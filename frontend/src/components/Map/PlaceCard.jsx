import React from 'react';

export default function PlaceCard({ poi }) {
    const getIcon = (type) => {
        switch (type) {
            case 'police': return 'shield';
            case 'hospital': return 'local_hospital';
            default: return 'home';
        }
    };

    const getColors = (type) => {
        switch (type) {
            case 'police': return 'bg-cyan-500/15 text-cyan-200';
            case 'hospital': return 'bg-rose-500/15 text-rose-100';
            default: return 'bg-violet-500/15 text-violet-200';
        }
    };

    return (
        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getColors(poi.type)}`}>
                    <span className="material-symbols-outlined">{getIcon(poi.type)}</span>
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-white line-clamp-1">{poi.name}</h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{poi.type}</p>
                </div>
            </div>
        </div>
    );
}
