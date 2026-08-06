import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { ArrowUpRight, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative mt-24 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 md:px-8 py-14 md:py-20">
                <div className="grid gap-10 md:grid-cols-4">
                    <div className="md:col-span-2 space-y-5">
                        <div className="inline-flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="font-headline text-2xl font-semibold tracking-tight text-white">Nirbhaya</p>
                                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-semibold">Premium Safety Platform</p>
                            </div>
                        </div>
                        <p className="max-w-xl text-sm md:text-base leading-relaxed text-slate-300">
                            A premium safety experience for women and families — designed with calm visuals, instant action, and full respect for privacy.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <span className="premium-chip">
                                <Sparkles className="h-3.5 w-3.5" />
                                24/7 protection
                            </span>
                            <span className="premium-chip">End-to-end encrypted</span>
                            <span className="premium-chip">Built for India</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product</h3>
                        <ul className="space-y-3 text-sm text-slate-200">
                            <li><Link to={ROUTES.DASHBOARD} className="hover:text-white inline-flex items-center gap-1 transition-colors">Dashboard <ArrowUpRight className="h-3.5 w-3.5" /></Link></li>
                            <li><Link to={ROUTES.MAP} className="hover:text-white inline-flex items-center gap-1 transition-colors">Safety Map <ArrowUpRight className="h-3.5 w-3.5" /></Link></li>
                            <li><Link to={ROUTES.SOS} className="hover:text-white inline-flex items-center gap-1 transition-colors">SOS <ArrowUpRight className="h-3.5 w-3.5" /></Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Support</h3>
                        <ul className="space-y-3 text-sm text-slate-200">
                            <li><a href="#" className="hover:text-white inline-flex items-center gap-1 transition-colors">Privacy policy <ArrowUpRight className="h-3.5 w-3.5" /></a></li>
                            <li><a href="#" className="hover:text-white inline-flex items-center gap-1 transition-colors">Terms of service <ArrowUpRight className="h-3.5 w-3.5" /></a></li>
                            <li><a href="#" className="hover:text-white inline-flex items-center gap-1 transition-colors">Contact support <ArrowUpRight className="h-3.5 w-3.5" /></a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
                    <p>© 2026 Nirbhaya. All rights reserved.</p>
                    <p>Designed as a premium privacy-first SaaS experience.</p>
                </div>
            </div>
        </footer>
    );
}
