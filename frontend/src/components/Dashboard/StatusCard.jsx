import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export default function StatusCard({ isSafe = true }) {
  return (
    <div className={`premium-panel-strong p-6 md:p-8 ${isSafe ? 'border-[#DCDDD5] bg-white' : 'border-[#C62828]/40 bg-[#C62828]/10'}`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isSafe ? 'bg-[#4F7D55]/15 text-[#4F7D55]' : 'bg-[#C62828]/15 text-[#C62828]'}`}>
            {isSafe ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#687067]">
              {isSafe ? 'Protected state' : 'Alert state'}
            </p>
            <h2 className="mt-2 font-headline text-2xl font-semibold text-[#28302A]">
              {isSafe ? 'You are within a safe zone.' : 'Alert active.'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#687067]">
              {isSafe
                ? 'Background tracking is active and your trusted guardians can see the journey state.'
                : 'The SOS workflow is active and responders are being notified through the existing flow.'}
            </p>
          </div>
        </div>

        <Link
          to="/sos"
          className={`${isSafe ? 'btn-primary' : 'btn-danger'}`}
        >
          {isSafe ? 'Trigger SOS' : 'Cancel SOS'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
