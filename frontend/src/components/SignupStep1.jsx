import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';

export default function SignupStep1({ formData, setFormData, errors, onContinue, isLoading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhoneChange = (e) => {
    setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }));
  };

  const password = formData.password || '';
  const checks = {
    length: password.length >= 8,
    cases: /(?=.*[a-z])(?=.*[A-Z])/.test(password),
    number: /(?=.*\d)/.test(password),
    special: /(?=.*[!@#$%^&*()_+{}:"|<>?`~\-=[\]\\;',./])/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7A8E72]">Step 1</p>
        <h2 className="mt-2 font-headline text-3xl font-semibold text-[#28302A]">Create your account</h2>
        <p className="mt-2 text-[#687067]">The essentials, structured with clarity and fewer distractions.</p>
      </div>

      <div className="grid gap-5">
        <label className="block">
          <span className="premium-label">Full name</span>
          <input name="fullName" value={formData.fullName} onChange={handleChange} className="premium-input" placeholder="Veda Menon" />
          {errors.fullName && <p className="mt-2 text-sm text-[#C62828]">{errors.fullName}</p>}
        </label>

        <label className="block">
          <span className="premium-label">Email address</span>
          <input name="email" type="email" value={formData.email} onChange={handleChange} className="premium-input" placeholder="veda.menon@example.com" />
          {errors.email && <p className="mt-2 text-sm text-[#C62828]">{errors.email}</p>}
        </label>

        <label className="block">
          <span className="premium-label">Phone number</span>
          <input name="phone" value={formData.phone} onChange={handlePhoneChange} className="premium-input" placeholder="98XXXXXXXX" />
          {errors.phone && <p className="mt-2 text-sm text-[#C62828]">{errors.phone}</p>}
        </label>

        <label className="block">
          <span className="premium-label">Password</span>
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className="premium-input pr-11" placeholder="Create a strong password" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#687067] hover:bg-[#FAF0EA] hover:text-[#28302A]">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-4 rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4">
              <div className="mb-3 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((index) => (
                  <div key={index} className={`h-1.5 rounded-full ${index <= score ? 'bg-[#7A8E72]' : 'bg-[#DCDDD5]'}`} />
                ))}
              </div>
              <div className="space-y-2 text-sm text-[#687067]">
                {[
                  ['length', 'At least 8 characters'],
                  ['cases', 'Uppercase and lowercase letters'],
                  ['number', 'At least one number'],
                  ['special', 'At least one special character'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    {checks[key] ? <CheckCircle2 className="h-4 w-4 text-[#4F7D55]" /> : <Circle className="h-4 w-4 text-[#B8A99A]" />}
                    <span className="text-[#28302A]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {errors.password && <p className="mt-2 text-sm text-[#C62828]">{errors.password}</p>}
        </label>

        <label className="block">
          <span className="premium-label">Confirm password</span>
          <div className="relative">
            <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} className="premium-input pr-11" placeholder="Re-enter password" />
            <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#687067] hover:bg-[#FAF0EA] hover:text-[#28302A]">
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-2 text-sm text-[#C62828]">{errors.confirmPassword}</p>}
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={!!formData.termsAccepted}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-[#DCDDD5] bg-transparent text-[#7A8E72] accent-[#7A8E72]"
          />
          <span className="text-sm text-[#687067]">
            I accept the Terms of Service and Privacy Policy.
          </span>
        </label>
        {errors.termsAccepted && <p className="text-sm text-[#C62828]">{errors.termsAccepted}</p>}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={isLoading}
        className="btn-primary w-full justify-center"
      >
        Continue
      </button>
    </div>
  );
}
