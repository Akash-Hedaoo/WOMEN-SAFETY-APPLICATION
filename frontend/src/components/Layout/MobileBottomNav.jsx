import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map as MapIcon, ShieldAlert, Users, Settings } from 'lucide-react';

const items = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/map', icon: MapIcon, label: 'Map' },
    { path: '/sos', icon: ShieldAlert, label: 'SOS', center: true },
    { path: '/guardians', icon: Users, label: 'Guardians' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileBottomNav() {
    const location = useLocation();

    return (
        <nav className="fixed inset-x-0 bottom-3 z-50 mx-auto flex h-18 max-w-[96%] items-center justify-around rounded-[28px] border border-[#DCDDD5] bg-white/95 px-2 shadow-xl shadow-black/5 backdrop-blur-2xl md:hidden">
            {items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;

                if (item.center) {
                    return (
                        <Link key={item.path} to={item.path} className="relative -mt-8 flex flex-col items-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C62828] text-white shadow-lg transition-transform hover:scale-105">
                                <Icon className="h-6 w-6" />
                            </div>
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C62828]">SOS</span>
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex w-14 flex-col items-center gap-1 rounded-2xl py-2 transition-all ${
                            active ? 'text-[#7A8E72]' : 'text-[#687067] hover:text-[#28302A]'
                        }`}
                    >
                        <Icon className={`h-5 w-5 ${active ? 'text-[#7A8E72]' : ''}`} />
                        <span className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${active ? 'text-[#7A8E72]' : ''}`}>
                            {item.label}
                        </span>
                        <span className={`h-1 w-1 rounded-full bg-[#7A8E72] transition-all ${active ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                    </Link>
                );
            })}
        </nav>
    );
}
