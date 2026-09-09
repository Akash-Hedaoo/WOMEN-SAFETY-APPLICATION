import React from 'react';

export default function SecurityBadges() {
    return (
        <div className="mt-8 grid gap-3 border-t border-[#DCDDD5] pt-6 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4 text-center">
                <span className="material-symbols-outlined mb-1 text-3xl text-[#7A8E72]">lock</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#687067]">256-bit AES</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4 text-center">
                <span className="material-symbols-outlined mb-1 text-3xl text-[#7A8E72]">verified_user</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#687067]">RBI compliant</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4 text-center">
                <span className="material-symbols-outlined mb-1 text-3xl text-[#7A8E72]">credit_card</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#687067]">PCI-DSS Level 1</span>
            </div>
        </div>
    );
}
