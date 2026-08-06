import React from 'react';

const partners = [
    { icon: 'verified', name: 'NCW India', description: 'National Commission for Women' },
    { icon: 'verified_user', name: 'iSafe Network', description: 'Certified safety platform' },
    { icon: 'emergency', name: '112 India', description: 'Integrated emergency response' },
    { icon: 'lock', name: 'Data secure', description: 'End-to-end encrypted' },
];

export default function TrustSection() {
    return (
        <section className="py-24">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-8 lg:grid-cols-5">
                <div className="lg:col-span-3">
                    <div className="premium-panel-strong p-8 md:p-10">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Trust signal</p>
                        <blockquote className="mt-5 space-y-5">
                            <p className="font-headline text-2xl font-semibold leading-tight text-white md:text-4xl">
                                “A safety product can be powerful without feeling aggressive.”
                            </p>
                            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                                This redesign emphasizes confidence, hierarchy, and calm action. The product feels more like a premium control room than a utility app.
                            </p>
                            <footer className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
                                — Product design direction
                            </footer>
                        </blockquote>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {partners.map((partner) => (
                        <div key={partner.name} className="premium-panel flex items-center gap-4 p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-violet-200">
                                <span className="material-symbols-outlined">{partner.icon}</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{partner.name}</p>
                                <p className="text-xs text-slate-400">{partner.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
