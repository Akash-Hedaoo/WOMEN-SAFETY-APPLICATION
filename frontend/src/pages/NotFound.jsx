import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { ROUTES } from '../utils/constants';

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#DCDDD5] bg-[#FAF0EA] text-[#7A8E72]">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">404</p>
        <h1 className="mt-3 font-headline text-5xl font-semibold text-[#28302A] md:text-7xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-lg text-[#687067]">
          The route you requested does not exist. Return to the main workspace.
        </p>
        <Link to={ROUTES.HOME} className="btn-primary mt-8 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Return home
        </Link>
      </div>
    </div>
  );
}
