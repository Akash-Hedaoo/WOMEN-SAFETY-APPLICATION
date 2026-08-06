import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Safety Map', path: '/map', icon: 'map' },
    { name: 'SOS Alerts', path: '/sos', icon: 'emergency' },
    { name: 'Guardians', path: '/guardians', icon: 'group' },
    { name: 'Wellness', path: '/wellness', icon: 'self_improvement' },
    { name: 'Current Affairs', path: '/current-affairs', icon: 'newspaper' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
];

export default function DashboardSidebar() {
    const location = useLocation();

    return (
        <aside className="hidden h-full w-72 shrink-0 border-r border-white/10 bg-white/5 p-4 backdrop-blur-2xl md:block">
            <nav className="space-y-2">
                {links.map((link) => {
                    const active = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                                active ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-200 hover:bg-white/10'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${active ? 'text-violet-600' : 'text-violet-300'}`}>{link.icon}</span>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
