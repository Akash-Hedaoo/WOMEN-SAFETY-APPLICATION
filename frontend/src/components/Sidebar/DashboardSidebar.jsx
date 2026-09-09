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
        <aside className="hidden h-full w-72 shrink-0 border-r border-[#DCDDD5] bg-white/95 p-4 backdrop-blur-2xl md:block">
            <nav className="space-y-2">
                {links.map((link) => {
                    const active = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                                active ? 'bg-[#A8B8A0]/30 text-[#28302A] border border-[#A8B8A0]/50 font-semibold shadow-sm' : 'text-[#687067] hover:bg-[#FAF8F5] hover:text-[#28302A]'
                            }`}
                        >
                            <span className={`material-symbols-outlined ${active ? 'text-[#7A8E72]' : 'text-[#A8B8A0]'}`}>{link.icon}</span>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
