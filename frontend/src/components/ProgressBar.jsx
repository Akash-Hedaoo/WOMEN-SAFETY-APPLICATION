import React from 'react';

const ProgressBar = ({ currentStep }) => {
  return (
    <div className="mb-8 rounded-[28px] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl font-semibold ${currentStep >= 1 ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'}`}>
          1
        </div>
        <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-violet-500' : 'bg-white/10'}`} />
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl font-semibold ${currentStep >= 2 ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'}`}>
          2
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        <span className={currentStep >= 1 ? 'text-violet-200' : ''}>Essential details</span>
        <span>Step {currentStep} of 2</span>
        <span className={currentStep >= 2 ? 'text-violet-200' : ''}>Emergency contact</span>
      </div>
    </div>
  );
};

export default ProgressBar;
