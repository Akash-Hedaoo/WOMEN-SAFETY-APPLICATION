import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const features = [
    {
        title: 'Live safety map',
        desc: 'See verified safe zones, support points, and route confidence in a polished, low-friction map experience.',
        icon: 'map',
    },
    {
        title: 'Instant SOS',
        desc: 'Trigger emergency workflows with a decisive interaction pattern that stays readable under stress.',
        icon: 'sos',
    },
    {
        title: 'Guardian network',
        desc: 'Keep trusted contacts in sync with elegant status cards, alerts, and journey visibility.',
        icon: 'group',
    },
];

export default function FeaturesSection() {
    return (
        <section className="relative py-24">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
                <div className="mx-auto mb-14 max-w-3xl text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Product surface</p>
                    <h2 className="mt-3 font-headline text-3xl font-semibold text-white md:text-5xl">Designed to feel premium, calm, and immediate</h2>
                    <p className="mt-4 text-slate-300">
                        Every interaction is shaped for confidence: softer hierarchy, clearer actions, and far less visual noise.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="card-premium h-full p-7 md:p-8">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-violet-500/30 to-pink-500/20 text-violet-200">
                                    <span className="material-symbols-outlined text-2xl">{features[0].icon}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Hero capability</p>
                                    <h3 className="font-headline text-3xl font-semibold text-white">{features[0].title}</h3>
                                </div>
                            </div>
                            <p className="max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">{features[0].desc}</p>
                            <div className="mt-8 overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-[20px] bg-slate-950/60 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Confidence</p>
                                        <p className="mt-2 text-lg font-semibold text-white">Clear map hierarchy</p>
                                    </div>
                                    <div className="rounded-[20px] bg-gradient-to-br from-violet-500/20 to-pink-500/10 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200">Action</p>
                                        <p className="mt-2 text-lg font-semibold text-white">Faster SOS access</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 grid gap-5">
                        <div className="card-premium group">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/20 text-violet-200 transition-transform duration-300 group-hover:scale-105">
                                <span className="material-symbols-outlined text-2xl">{features[1].icon}</span>
                            </div>
                            <h3 className="font-headline text-2xl font-semibold text-white">{features[1].title}</h3>
                            <p className="mt-4 text-sm leading-relaxed text-slate-300">{features[1].desc}</p>
                            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 transition-transform group-hover:translate-x-1">
                                Learn more <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="card-premium group">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/20 text-violet-200 transition-transform duration-300 group-hover:scale-105">
                                <span className="material-symbols-outlined text-2xl">{features[2].icon}</span>
                            </div>
                            <h3 className="font-headline text-2xl font-semibold text-white">{features[2].title}</h3>
                            <p className="mt-4 text-sm leading-relaxed text-slate-300">{features[2].desc}</p>
                            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 transition-transform group-hover:translate-x-1">
                                Learn more <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
