import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UPIForm from '../components/Payment/UPIForm';
import CardForm from '../components/Payment/CardForm';
import SecurityBadges from '../components/Payment/SecurityBadges';
import Button from '../components/Common/Button';
import { ShieldCheck } from 'lucide-react';

export default function Payment() {
  const [method, setMethod] = useState('upi');
  const navigate = useNavigate();

  const handlePayment = (e) => {
    e.preventDefault();
    alert('Payment Successful!');
    navigate('/dashboard');
  };

  return (
    <div className="page-shell mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="premium-panel-strong w-full overflow-hidden">
        <div className="border-b border-white/10 bg-gradient-to-r from-violet-500/20 via-purple-500/15 to-pink-500/15 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">Checkout</p>
              <h1 className="mt-2 font-headline text-3xl font-semibold text-white">Upgrade to Premium</h1>
            </div>
            <div className="premium-chip">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-200" />
              Secure payment
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Premium Guardian Plan</p>
                  <p className="mt-1 text-sm text-slate-400">Billed monthly</p>
                </div>
                <p className="font-headline text-4xl font-semibold text-white">₹199</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              {['upi', 'card'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMethod(item)}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold capitalize transition ${
                    method === item ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/8'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <form onSubmit={handlePayment} className="mt-6 space-y-6">
              {method === 'upi' ? <UPIForm /> : <CardForm />}
              <Button type="submit" variant="primary" className="w-full justify-center">
                Pay securely
              </Button>
            </form>
          </div>

          <div className="p-6">
            <div className="premium-panel h-full p-6">
              <h2 className="font-headline text-2xl font-semibold text-white">What you get</h2>
              <ul className="mt-6 space-y-4 text-sm text-slate-300">
                {[
                  'Live location sharing',
                  'Priority SOS routing',
                  'Unlimited guardians',
                  'Offline map access',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-violet-200">check_circle</span>
                    {item}
                  </li>
                ))}
              </ul>
              <SecurityBadges />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
