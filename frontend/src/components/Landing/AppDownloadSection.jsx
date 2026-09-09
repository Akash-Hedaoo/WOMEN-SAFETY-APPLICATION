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
                    <h2 className="font-headline text-3xl font-semibold text-[#28302A] md:text-5xl">Built to feel native on mobile</h2>
                    <p className="max-w-xl text-[#687067]">
                        The app now uses a denser dock, floating actions, better spacing, and stronger visual separation for small screens.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button className="btn-secondary">App Store</button>
                        <button className="btn-secondary">Google Play</button>
                    </div>
                </div>

                <div className="premium-panel-strong mx-auto w-full max-w-sm p-4">
                    <div className="rounded-[22px] border border-[#DCDDD5] bg-[#FAF8F5] p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-semibold text-[#28302A]">Safe-Era mobile preview</span>
                            <span className="premium-chip">Live</span>
                        </div>
                        <div className="rounded-[20px] border border-[#DCDDD5] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#687067]">Safety status</p>
                                    <p className="mt-2 text-xl font-semibold text-[#28302A]">Connected & monitoring</p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-[#C62828] text-white flex items-center justify-center font-semibold shadow-sm">SOS</div>
                            </div>
                            <div className="mt-6 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-[#FAF0EA] border border-[#DCDDD5] p-3 text-center text-xs text-[#28302A]">Map</div>
                                <div className="rounded-2xl bg-[#FAF0EA] border border-[#DCDDD5] p-3 text-center text-xs text-[#28302A]">Guardians</div>
                                <div className="rounded-2xl bg-[#FAF0EA] border border-[#DCDDD5] p-3 text-center text-xs text-[#28302A]">Alerts</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
