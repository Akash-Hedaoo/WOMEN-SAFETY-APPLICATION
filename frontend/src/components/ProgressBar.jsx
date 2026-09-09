import React from 'react';

const ProgressBar = ({ currentStep }) => {
  return (
    <div className="mb-8 rounded-[28px] border border-[#DCDDD5] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl font-semibold ${currentStep >= 1 ? 'bg-[#7A8E72] text-white' : 'bg-[#FAF0EA] text-[#687067]'}`}>
          1
        </div>
        <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-[#7A8E72]' : 'bg-[#DCDDD5]'}`} />
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl font-semibold ${currentStep >= 2 ? 'bg-[#7A8E72] text-white' : 'bg-[#FAF0EA] text-[#687067]'}`}>
          2
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-[#687067]">
        <span className={currentStep >= 1 ? 'text-[#7A8E72]' : ''}>Essential details</span>
        <span>Step {currentStep} of 2</span>
        <span className={currentStep >= 2 ? 'text-[#7A8E72]' : ''}>Emergency contact</span>
      </div>
    </div>
  );
};

export default ProgressBar;
