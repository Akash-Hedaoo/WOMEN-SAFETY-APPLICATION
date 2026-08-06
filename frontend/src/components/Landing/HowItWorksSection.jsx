import React from 'react';

const steps = [
    { number: '01', icon: 'person_add', title: 'Create your profile', description: 'Set up the essentials in under two minutes with a minimal, guided flow.' },
    { number: '02', icon: 'group_add', title: 'Add guardians', description: 'Invite family or trusted contacts into a private network with clear ownership.' },
    { number: '03', icon: 'shield_person', title: 'Move with confidence', description: 'Use map, share, and SOS tools in a layout that remains readable when things matter.' },
];

export default function HowItWorksSection() {
    return (
        <section className="py-24">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
                <div className="mb-16 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Workflow</p>
                    <h2 className="mt-3 font-headline text-3xl font-semibold text-white md:text-5xl">A three-step path to coverage</h2>
                    <p className="mt-4 text-slate-300">The product strips away friction, making the first useful action obvious.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {steps.map((step) => (
                        <div key={step.number} className="premium-panel p-7">
                            <div className="mb-6 flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-200">{step.number}</span>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-violet-200">
                                    <span className="material-symbols-outlined">{step.icon}</span>
                                </div>
                            </div>
                            <h3 className="font-headline text-2xl font-semibold text-white">{step.title}</h3>
                            <p className="mt-4 text-sm leading-relaxed text-slate-300">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
