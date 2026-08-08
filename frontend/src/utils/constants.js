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
};

export const APP_NAME = 'Safe-Era';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const MOCK_USER = {
    name: 'Anushka Prasad',
    email: 'anushka.prasad@example.com',
    phone: '+91 9876543210',
    emergencyContact: {
        name: 'Akash Prasad',
        phone: '+91 9823456781'
    }
};
