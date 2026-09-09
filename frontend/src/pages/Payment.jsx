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
        <div className="border-b border-[#DCDDD5] bg-[#FAF0EA] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">Checkout</p>
              <h1 className="mt-2 font-headline text-3xl font-semibold text-[#28302A]">Upgrade to Premium</h1>
            </div>
            <div className="premium-chip">
              <ShieldCheck className="h-3.5 w-3.5 text-[#7A8E72]" />
              Secure payment
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.1fr_.9fr]">
          <div className="border-b border-[#DCDDD5] p-6 lg:border-b-0 lg:border-r">
            <div className="rounded-[22px] border border-[#DCDDD5] bg-[#FAF8F5] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#28302A]">Premium Guardian Plan</p>
                  <p className="mt-1 text-sm text-[#687067]">Billed monthly</p>
                </div>
                <p className="font-headline text-4xl font-semibold text-[#28302A]">₹199</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2 rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-1">
              {['upi', 'card'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMethod(item)}
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold capitalize transition ${
                    method === item ? 'bg-[#7A8E72] text-white shadow-sm' : 'text-[#687067] hover:bg-white'
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
              <h2 className="font-headline text-2xl font-semibold text-[#28302A]">What you get</h2>
              <ul className="mt-6 space-y-4 text-sm text-[#687067]">
                {[
                  'Live location sharing',
                  'Priority SOS routing',
                  'Unlimited guardians',
                  'Offline map access',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#7A8E72]">check_circle</span>
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
