import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingCard({ title, price, highlighted, features }) {
    const isPremium = highlighted;

    return (
        <div className={`card-premium relative flex flex-col ${isPremium ? 'border-[#7A8E72] bg-[#FAF0EA]' : ''}`}>
            {isPremium && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7A8E72] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                    Most Popular
                </span>
            )}

            <h3 className="font-headline text-2xl font-semibold text-[#28302A] mb-2">{title}</h3>
            <div className="mb-6">
                <span className="font-headline text-4xl font-semibold text-[#28302A]">{price}</span>
                {price !== 'Free' && <span className="font-body text-[#687067]">/mo</span>}
            </div>

            <ul className="mb-8 flex-grow space-y-4 text-[#687067] font-body">
                {features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                        <span className="material-symbols-outlined mt-0.5 text-sm text-[#7A8E72]">check_circle</span>
                        <span>{feat}</span>
                    </li>
                ))}
            </ul>

            <Link to="/payment" className="btn-primary mt-auto">
                Choose {title}
            </Link>
        </div>
    );
}
