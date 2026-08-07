import React from 'react';
import PricingCard from '../components/Pricing/PricingCard';
import FAQAccordion from '../components/Pricing/FAQAccordion';
import Footer from '../components/Common/Footer';

export default function Pricing() {
  const plans = [
    {
      title: 'Free',
      price: 'Free',
      features: ['One-tap SOS', 'Live location sharing', 'Community safe maps'],
    },
    {
      title: 'Premium',
      price: '₹199',
      highlighted: true,
      features: ['Everything in Free', 'Guardian network', 'Priority routing', 'Offline maps'],
    },
    {
      title: 'Annual',
      price: '₹1990',
      features: ['Everything in Premium', 'Save 35% annually', 'Safety alarm bonus'],
    },
  ];

  return (
    <div className="page-shell min-h-screen pt-28">
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Plans</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-6xl">Pricing that feels premium</h1>
          <p className="mt-4 text-lg text-slate-300">
            The product now presents pricing as a clean decision surface, not a standard sales table.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => <PricingCard key={plan.title} {...plan} />)}
        </div>

        <div className="mt-20">
          <h2 className="mb-8 text-center font-headline text-3xl font-semibold text-white">Frequently asked questions</h2>
          <FAQAccordion />
        </div>
      </div>

      <Footer />
    </div>
  );
}
