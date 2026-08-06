import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    return (
        <div className="flex h-screen overflow-hidden bg-background text-on-surface">
            <Sidebar />
            <div className="relative h-screen flex-1 overflow-y-auto md:ml-72">
                {children}
            </div>
        </div>
    );
}
