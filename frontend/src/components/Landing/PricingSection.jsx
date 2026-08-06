import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Basic',
        price: 'Free',
        features: ['Safety map', 'Standard SOS alerts', '2 active guardians'],
        cta: 'Get started',
    },
    {
        name: 'Premium',
        price: '₹199',
        period: '/mo',
        features: ['Live location sharing', 'Priority SOS routing', 'Unlimited guardians', 'Offline maps'],
        cta: 'Choose Premium',
        featured: true,
    },
    {
        name: 'Annual',
        price: '₹1990',
        period: '/yr',
        features: ['All premium features', '2 months free', 'Priority support', 'Annual billing'],
        cta: 'Choose Annual',
    },
];

export default function PricingSection() {
    return (
        <section className="py-24">
            <div className="mx-auto max-w-7xl px-6 md:px-8">
                <div className="mx-auto mb-14 max-w-3xl text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Pricing</p>
                    <h2 className="mt-3 font-headline text-3xl font-semibold text-white md:text-5xl">Simple pricing with a premium finish</h2>
                    <p className="mt-4 text-slate-300">The plan grid now reads like a product decision, not a spreadsheet.</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
                    {plans.map((plan) => (
                      <div
                          key={plan.name}
                          className={`card-premium relative flex flex-col ${plan.featured ? 'lg:col-span-5 border-violet-300/40 bg-gradient-to-b from-violet-500/20 to-pink-500/10' : 'lg:col-span-3'}`}
                        >
                            {plan.featured && <div className="premium-chip absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-950">Most trusted</div>}
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">{plan.name}</p>
                            <div className="mt-4 flex items-end gap-2">
                                <span className="font-headline text-5xl font-semibold text-white">{plan.price}</span>
                                {plan.period && <span className="pb-2 text-sm text-slate-400">{plan.period}</span>}
                            </div>
                            <ul className="mt-8 space-y-3 text-sm text-slate-300">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-4 w-4 text-violet-200" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link to={ROUTES.SIGNUP} className={`btn-primary mt-8 ${plan.featured ? 'bg-white text-slate-950' : ''}`}>
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
