import React from 'react';

export default function SecurityBadges() {
    return (
        <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="material-symbols-outlined mb-1 text-3xl text-violet-200">lock</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">256-bit AES</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="material-symbols-outlined mb-1 text-3xl text-violet-200">verified_user</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">RBI compliant</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <span className="material-symbols-outlined mb-1 text-3xl text-violet-200">credit_card</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">PCI-DSS Level 1</span>
            </div>
        </div>
    );
}
