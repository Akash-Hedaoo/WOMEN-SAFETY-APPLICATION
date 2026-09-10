export const COLORS = {
    primary: '#8b5cf6',
    secondary: '#c084fc',
    background: '#0f172a',
    white: '#FFFFFF',
    darkText: '#f8fafc',
    mutedText: '#cbd5e1',
    accent: '#ec4899',
    danger: '#fb7185',
    success: '#34d399',
    border: 'rgba(255,255,255,0.12)',
    lightGray: 'rgba(255,255,255,0.06)',
};

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    DASHBOARD: '/dashboard',
    SOS: '/sos',
    MAP: '/map',
    GUARDIANS: '/guardians',
    WELLNESS: '/wellness',
    NEWS: '/current-affairs',
    SETTINGS: '/settings',
    ADMIN_LOGIN: '/admin/login',
    ADMIN: '/admin',
};

export const APP_NAME = 'Safe-Era';
// Android Studio's Debug task creates `adb reverse tcp:5001 tcp:5001`, so the
// same loopback address reaches the local backend from either a USB phone or
// an Android emulator. A deployed build must set VITE_API_BASE_URL to its HTTPS
// server before it is packaged.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';

export const MOCK_USER = {
    name: 'Anushka Prasad',
    email: 'anushka.prasad@example.com',
    phone: '+91 9876543210',
    emergencyContact: {
        name: 'Akash Prasad',
        phone: '+91 9823456781'
    }
};
