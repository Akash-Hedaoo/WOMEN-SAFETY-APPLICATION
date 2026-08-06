import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    className = '',
    ...props
}) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outlined: 'btn-outlined',
        danger: 'btn-danger',
    };

    return (
        <button
            className={`${variants[variant]} focus-ring ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
