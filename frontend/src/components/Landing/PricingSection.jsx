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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">Pricing</p>
                    <h2 className="mt-3 font-headline text-3xl font-semibold text-[#28302A] md:text-5xl">Simple pricing with a premium finish</h2>
                    <p className="mt-4 text-[#687067]">The plan grid now reads like a product decision, not a spreadsheet.</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
                    {plans.map((plan) => (
                      <div
                          key={plan.name}
                          className={`card-premium relative flex flex-col ${plan.featured ? 'lg:col-span-5 border-[#7A8E72] bg-[#FAF0EA]' : 'lg:col-span-3'}`}
                        >
                            {plan.featured && <div className="premium-chip absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7A8E72] text-white border-none shadow-sm">Most trusted</div>}
                            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#687067]">{plan.name}</p>
                            <div className="mt-4 flex items-end gap-2">
                                <span className="font-headline text-5xl font-semibold text-[#28302A]">{plan.price}</span>
                                {plan.period && <span className="pb-2 text-sm text-[#687067]">{plan.period}</span>}
                            </div>
                            <ul className="mt-8 space-y-3 text-sm text-[#687067]">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-4 w-4 text-[#7A8E72]" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link to={ROUTES.SIGNUP} className="btn-primary mt-8">
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
