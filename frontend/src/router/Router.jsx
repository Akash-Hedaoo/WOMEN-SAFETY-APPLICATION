import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

// Layouts
import Navbar from '../components/Layout/Navbar';
import MobileBottomNav from '../components/Layout/MobileBottomNav';

// Pages - Direct imports for debugging
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import AdminLogin from '../pages/AdminLogin';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import SOS from '../pages/SOS';
import Map from '../pages/Map';
import GuardianNetwork from '../pages/GuardianNetworkPage';
import Wellness from '../pages/WellnessPage';
import News from '../pages/CurrentAffairsPage';
import Settings from '../pages/SettingsPage';
import ICCCDashboard from '../pages/ICCCDashboard';
import NotFound from '../pages/NotFound';

// Global Layout wrapper
const StandardLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col pt-20 pb-24 md:pb-0">
            {children}
        </main>
        <MobileBottomNav />
    </div>
);

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="h-full"
    >
        {children}
    </motion.div>
);

// Protected Route Component
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-background text-primary font-headline italic animate-pulse text-2xl">
            Safeguarding...
        </div>
    );

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? <Navigate to="/admin" replace /> : children;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <div className="h-screen w-full bg-[#FAF8F5]" />;
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
    return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

const AdminLayout = ({ children }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#FAF8F5]">
            <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#DCDDD5] bg-white px-4 shadow-sm sm:px-6">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C62828] text-sm font-bold text-white">A</span>
                    <div>
                        <p className="text-sm font-semibold text-[#28302A]">Safe-Era Admin</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C62828]">ICCC command center</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn-secondary text-xs">Log out</button>
            </header>
            {children}
        </div>
    );
};

export default function AppRouter() {
    return (
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    );
}

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<StandardLayout><PageTransition><Landing /></PageTransition></StandardLayout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route path="/dashboard" element={<PrivateRoute><StandardLayout><PageTransition><Dashboard /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/sos" element={<PrivateRoute><StandardLayout><PageTransition><SOS /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/map" element={<PrivateRoute><StandardLayout><PageTransition><Map /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/guardians" element={<PrivateRoute><StandardLayout><PageTransition><GuardianNetwork /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/wellness" element={<PrivateRoute><StandardLayout><PageTransition><Wellness /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/current-affairs" element={<PrivateRoute><StandardLayout><PageTransition><News /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><StandardLayout><PageTransition><Settings /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminLayout><PageTransition><ICCCDashboard /></PageTransition></AdminLayout></AdminRoute>} />
                <Route path="/iccc" element={<Navigate to="/admin/login" replace />} />

                <Route path="*" element={<StandardLayout><PageTransition><NotFound /></PageTransition></StandardLayout>} />
            </Routes>
        </AnimatePresence>
    );
}
