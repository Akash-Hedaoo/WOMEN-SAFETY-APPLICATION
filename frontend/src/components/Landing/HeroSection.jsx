import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { ArrowRight, Shield, Sparkles, TriangleAlert } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="page-shell gradient-hero min-h-screen overflow-hidden pt-24">
            <div className="absolute inset-x-0 top-28 mx-auto h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />

            <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-14 md:px-8 lg:grid-cols-12">
                <div className="space-y-8 lg:col-span-6">
                    <div className="premium-chip w-fit">
                        <Shield className="h-3.5 w-3.5 text-violet-200" />
                        Women-first safety platform
                    </div>

                    <div className="space-y-5">
                        <h1 className="font-headline text-5xl font-semibold tracking-tight text-white md:text-7xl">
                            Calm control for every journey.
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
                            Real-time safety mapping, instant SOS workflows, and a guardian network wrapped in a premium interface built for clarity under pressure.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link to={ROUTES.SIGNUP} className="btn-primary">
                            Get started free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button className="btn-secondary">
                            Explore the product
                        </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {[
                            { value: '10k+', label: 'Women protected' },
                            { value: '98%', label: 'SOS response rate' },
                            { value: '30 sec', label: 'Average alert time' },
                        ].map((item) => (
                            <div key={item.label} className="premium-panel p-4">
                                <p className="font-headline text-2xl font-semibold text-white">{item.value}</p>
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-6">
                    <div className="relative mx-auto max-w-[640px]">
                        <div className="absolute -left-6 top-12 hidden h-24 w-24 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl lg:block" />
                        <div className="absolute -right-4 top-0 hidden h-20 w-20 rounded-[24px] border border-violet-300/20 bg-violet-500/10 backdrop-blur-xl lg:block" />

                        <div className="grid gap-4 lg:grid-cols-[1.12fr_.88fr]">
                            <div className="premium-panel-strong overflow-hidden p-4 shadow-glow">
                                <div className="rounded-[26px] border border-white/10 bg-slate-950/60 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Command center</p>
                                            <h2 className="mt-1 font-headline text-xl font-semibold text-white">Dashboard preview</h2>
                                        </div>
                                        <div className="premium-chip">
                                            <TriangleAlert className="h-3.5 w-3.5 text-rose-200" />
                                            Active
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/5">
                                        <img
                                            alt="Premium safety dashboard preview"
                                            src="/hero-illustration.png"
                                            className="h-[420px] w-full object-cover object-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 lg:pt-12">
                                <div className="rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Live status</p>
                                    <p className="mt-3 text-xl font-semibold text-white">Protected route in progress</p>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-300">Location sharing, guardian ping, and route monitoring are active.</p>
                                </div>

                                <div className="rounded-[28px] border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-pink-500/15 p-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200">Trusted by</p>
                                    <div className="mt-4 flex items-center gap-3">
                                        {['A','M','S'].map((letter, index) => (
                                            <div
                                                key={letter}
                                                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/60 text-sm font-semibold text-white"
                                                style={{ transform: `translateY(${index % 2 === 0 ? '0px' : '10px'})` }}
                                            >
                                                {letter}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-sm text-slate-300">Guardians, safety partners, and emergency response integrated in one flow.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
