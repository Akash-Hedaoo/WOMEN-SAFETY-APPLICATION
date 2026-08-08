import React, { useState } from 'react';

const FAQ_DATA = [
    { q: 'Is Safe-Era really free?', a: 'Yes! The core SOS and live location features are always free to ensure every woman has access to safety.' },
    { q: 'How does the Guardian Network work in Premium?', a: 'Premium matches you with background-checked local volunteers within a 5km radius to assist in emergencies.' }
];

export default function FAQAccordion() {
    const [openIdx, setOpenIdx] = useState(null);

    const toggle = (idx) => {
        setOpenIdx(openIdx === idx ? null : idx);
    };

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            {FAQ_DATA.map((faq, idx) => (
                <div key={idx} className="premium-panel overflow-hidden">
                    <button
                        className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-white transition hover:bg-white/5"
                        onClick={() => toggle(idx)}
                    >
                        {faq.q}
                        <span className="material-symbols-outlined text-violet-200">
                            {openIdx === idx ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                        </span>
                    </button>

                    {openIdx === idx && (
                        <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-300">
                            {faq.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
