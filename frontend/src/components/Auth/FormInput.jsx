import React from 'react';

export default function FormInput({ label, id, type = 'text', placeholder, value, onChange, icon }) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="premium-label" htmlFor={id}>{label}</label>
            <div className="relative">
                {icon && (
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                    </span>
                )}
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`premium-input ${icon ? 'pl-11' : 'pl-4'}`}
                />
            </div>
        </div>
    );
}
