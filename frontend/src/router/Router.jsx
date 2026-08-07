import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

// Layouts
import Navbar from '../components/Layout/Navbar';
import MobileBottomNav from '../components/Layout/MobileBottomNav';

// Pages - Direct imports for debugging
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import SOS from '../pages/SOS';
import Map from '../pages/Map';
import GuardianNetwork from '../pages/GuardianNetworkPage';
import Wellness from '../pages/WellnessPage';
import News from '../pages/CurrentAffairsPage';
import Settings from '../pages/SettingsPage';
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
    const { isAuthenticated, loading } = useAuth();

    if (loading) return (
        <div className="h-screen w-full flex items-center justify-center bg-background text-primary font-headline italic animate-pulse text-2xl">
            Safeguarding...
        </div>
    );

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function AppRouter() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
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

                <Route path="/dashboard" element={<PrivateRoute><StandardLayout><PageTransition><Dashboard /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/sos" element={<PrivateRoute><StandardLayout><PageTransition><SOS /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/map" element={<PrivateRoute><StandardLayout><PageTransition><Map /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/guardians" element={<PrivateRoute><StandardLayout><PageTransition><GuardianNetwork /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/wellness" element={<PrivateRoute><StandardLayout><PageTransition><Wellness /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/current-affairs" element={<PrivateRoute><StandardLayout><PageTransition><News /></PageTransition></StandardLayout></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><StandardLayout><PageTransition><Settings /></PageTransition></StandardLayout></PrivateRoute>} />

                <Route path="*" element={<StandardLayout><PageTransition><NotFound /></PageTransition></StandardLayout>} />
            </Routes>
        </AnimatePresence>
    );
}
