import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LayoutDashboard,
    Map as MapIcon,
    AlertTriangle,
    Users,
    Leaf,
    Newspaper,
    Menu,
    X,
    Bell,
    Settings,
    LogOut,
    Shield,
    Sparkles,
    Radio,
} from 'lucide-react';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const navLinks = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Map', path: ROUTES.MAP, icon: MapIcon },
    { name: 'SOS', path: ROUTES.SOS, icon: AlertTriangle },
    { name: 'Guardians', path: ROUTES.GUARDIANS, icon: Users },
    { name: 'ICCC Command', path: ROUTES.ICCC, icon: Radio },
    { name: 'Wellness', path: ROUTES.WELLNESS, icon: Leaf },
    { name: 'News', path: ROUTES.NEWS, icon: Newspaper },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-white/95 backdrop-blur-2xl border-b border-[#DCDDD5] shadow-md shadow-black/[0.03]' : 'bg-transparent'
            }`}
        >
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to={ROUTES.HOME} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7A8E72] shadow-sm">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div className="leading-tight">
                        <div className="font-headline text-lg font-semibold tracking-tight text-[#28302A]">Safe-Era</div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#687067]">Guardian network</div>
                    </div>
                </Link>

                <nav className="hidden items-center gap-1 rounded-full border border-[#DCDDD5] bg-[#FAF8F5] p-1 lg:flex">
                    {navLinks.map(({ name, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[#7A8E72] text-white shadow-sm'
                                        : 'text-[#28302A] hover:bg-white hover:text-[#7A8E72]'
                                }`
                            }
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {name}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    {isAuthenticated ? (
                        <>
                            <button className="rounded-2xl border border-[#DCDDD5] bg-white p-3 text-[#28302A] transition hover:bg-[#FAF8F5] hover:text-[#7A8E72] focus-ring" aria-label="Notifications">
                                <Bell className="h-4 w-4" />
                            </button>
                            <Link to={ROUTES.SETTINGS} className="rounded-2xl border border-[#DCDDD5] bg-white p-3 text-[#28302A] transition hover:bg-[#FAF8F5] hover:text-[#7A8E72] focus-ring" aria-label="Settings">
                                <Settings className="h-4 w-4" />
                            </Link>
                            <div className="flex items-center gap-3 rounded-2xl border border-[#DCDDD5] bg-white px-3 py-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A8E72] text-sm font-semibold text-white">
                                    {(user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden xl:block">
                                    <p className="text-xs font-semibold text-[#28302A]">{user?.name || 'User'}</p>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#687067]">Protected</p>
                                </div>
                            </div>
                            <button onClick={logout} className="btn-secondary">
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to={ROUTES.LOGIN} className="btn-secondary">Log in</Link>
                            <Link to={ROUTES.SIGNUP} className="btn-primary">
                                <Sparkles className="h-4 w-4" />
                                Get started
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#DCDDD5] bg-white p-3 text-[#28302A] lg:hidden focus-ring"
                    aria-label="Toggle navigation"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[#DCDDD5] bg-white/98 px-4 py-4 shadow-xl backdrop-blur-2xl lg:hidden"
                    >
                        <div className="mx-auto flex max-w-7xl flex-col gap-2">
                            {navLinks.map(({ name, path, icon: Icon }) => (
                                <NavLink
                                    key={path}
                                    to={path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                                            isActive ? 'bg-[#7A8E72] text-white' : 'text-[#28302A] hover:bg-[#FAF8F5]'
                                        }`
                                    }
                                >
                                    <Icon className="h-4 w-4" />
                                    {name}
                                </NavLink>
                            ))}
                            <div className="mt-2 grid gap-2 border-t border-[#DCDDD5] pt-3">
                                {!isAuthenticated ? (
                                    <>
                                        <Link to={ROUTES.LOGIN} className="btn-secondary justify-center">Log in</Link>
                                        <Link to={ROUTES.SIGNUP} className="btn-primary justify-center">Get started</Link>
                                    </>
                                ) : (
                                    <button onClick={logout} className="btn-danger justify-center">
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
