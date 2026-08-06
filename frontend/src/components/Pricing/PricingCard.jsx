import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingCard({ title, price, highlighted, features }) {
    const isPremium = highlighted;

    return (
        <div className={`card-premium relative flex flex-col ${isPremium ? 'border-violet-300/40 bg-gradient-to-b from-violet-500/20 to-pink-500/10' : ''}`}>
            {isPremium && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                    Most Popular
                </span>
            )}

            <h3 className="font-headline text-2xl font-semibold text-white mb-2">{title}</h3>
            <div className="mb-6">
                <span className="font-headline text-4xl font-semibold text-white">{price}</span>
                {price !== 'Free' && <span className="font-body text-slate-400">/mo</span>}
            </div>

            <ul className="mb-8 flex-grow space-y-4 text-slate-300 font-body">
                {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                        <span className="material-symbols-outlined mt-0.5 text-sm text-violet-200">check_circle</span>
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            <Link to="/payment" className={`btn-primary mt-auto ${isPremium ? 'bg-white text-slate-950' : ''}`}>
                Choose {title}
            </Link>
        </div>
    );
}
