import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, BadgeAlert, Users, Settings, Sparkles } from 'lucide-react';

const links = [
    { path: '/dashboard', label: 'Command center', icon: LayoutDashboard },
    { path: '/map', label: 'Safety map', icon: Map },
    { path: '/pricing', label: 'Plans', icon: Sparkles },
    { path: '/payment', label: 'Checkout', icon: BadgeAlert },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 bg-slate-950/90 px-5 py-6 backdrop-blur-2xl md:flex">
            <div className="flex h-full w-full flex-col">
                <div className="mb-8 rounded-[28px] border border-white/10 bg-white/6 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-glow">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-headline text-xl font-semibold text-white">The Guardian</h2>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Private safety workspace</p>
                        </div>
                    </div>
                </div>

                <nav className="space-y-2">
                    {links.map(({ path, label, icon: Icon }) => {
                        const active = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all ${
                                    active ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'bg-white/5 text-slate-200 hover:bg-white/10'
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-violet-300'}`} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-pink-500/20 p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-violet-200">Premium guardian plan</p>
                    <h3 className="mt-2 font-headline text-xl font-semibold text-white">Upgrade to Pro</h3>
                    <p className="mt-2 text-sm text-slate-300">Unlimited guardians, offline maps, and priority routing.</p>
                    <Link to="/pricing" className="btn-primary mt-4 w-full justify-center">
                        Explore plans
                    </Link>
                </div>
            </div>
        </aside>
    );
}
