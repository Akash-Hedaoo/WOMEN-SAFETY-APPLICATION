import React from 'react';

export default function AppDownloadSection() {
    return (
        <section className="py-24">
            <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-8 lg:grid-cols-2 lg:items-center">
                <div className="space-y-6">
                    <div className="premium-chip w-fit">
                        <span className="material-symbols-outlined text-sm">phone_iphone</span>
                        Mobile-ready experience
                    </div>
                    <h2 className="font-headline text-3xl font-semibold text-white md:text-5xl">Built to feel native on mobile</h2>
                    <p className="max-w-xl text-slate-300">
                        The app now uses a denser dock, floating actions, better spacing, and stronger visual separation for small screens.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button className="btn-secondary">App Store</button>
                        <button className="btn-secondary">Google Play</button>
                    </div>
                </div>

                <div className="premium-panel-strong mx-auto w-full max-w-sm p-4">
                    <div className="rounded-[22px] border border-white/10 bg-slate-950/70 p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-white">Safe-Era mobile preview</span>
                            <span className="premium-chip">Live</span>
                        </div>
                        <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-violet-500/20 to-pink-500/10 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Safety status</p>
                                    <p className="mt-2 text-xl font-semibold text-white">Connected & monitoring</p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-rose-500/20 text-rose-100 flex items-center justify-center font-semibold">SOS</div>
                            </div>
                            <div className="mt-6 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-white/8 p-3 text-center text-xs text-slate-300">Map</div>
                                <div className="rounded-2xl bg-white/8 p-3 text-center text-xs text-slate-300">Guardians</div>
                                <div className="rounded-2xl bg-white/8 p-3 text-center text-xs text-slate-300">Alerts</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
