import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, ArrowRight, Sparkles } from 'lucide-react';
import SignupStep1 from './SignupStep1';
import SignupStep2 from './SignupStep2';
import ProgressBar from './ProgressBar';
import { API_BASE_URL } from '../utils/constants';

export default function Signup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('authToken')) navigate('/dashboard');
  }, [navigate]);

  const validateStep1 = () => {
    const nextErrors = {};

    if (!formData.fullName || formData.fullName.length < 2 || formData.fullName.length > 50) {
      nextErrors.fullName = 'Full name must be between 2 and 50 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) nextErrors.email = 'Please enter a valid email address';

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone || !phoneRegex.test(formData.phone)) nextErrors.phone = 'Please enter a valid 10-digit Indian phone number';

    if (!formData.password || formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      nextErrors.password = 'Use uppercase, lowercase, and a number';
    }

    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (!formData.termsAccepted) nextErrors.termsAccepted = 'You must accept the terms';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;

    if (formData.emergencyContactName && (formData.emergencyContactName.length < 2 || formData.emergencyContactName.length > 50)) {
      nextErrors.emergencyContactName = 'Contact name must be between 2 and 50 characters';
    }
    if (formData.emergencyContactPhone && !phoneRegex.test(formData.emergencyContactPhone)) {
      nextErrors.emergencyContactPhone = 'Please enter a valid 10-digit Indian phone number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const register = async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  };

  const handleStep1Continue = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleStep2Continue = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      const data = await register({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelationship: formData.emergencyContactRelationship,
      });

      if (data.success) {
        localStorage.setItem('authToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ submit: 'Backend API is offline. Please start the backend server by running "npm start" in the backend directory.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Skip = async () => {
    setIsLoading(true);
    try {
      const data = await register({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (data.success) {
        localStorage.setItem('authToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setErrors({ submit: data.message || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ submit: 'Backend API is offline. Please start the backend server by running "npm start" in the backend directory.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,.18),_transparent_20%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-12">
        <aside className="relative hidden overflow-hidden border-r border-white/10 lg:col-span-5 lg:block">
          <div className="absolute inset-0 bg-[url('/auth-illustration.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-violet-950/80" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-violet-200" />
              Premium onboarding
            </div>
            <div className="max-w-xl space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Join the network</p>
              <h1 className="font-headline text-5xl font-semibold leading-tight text-white">
                Start with clarity, not clutter.
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-slate-300">
                The signup experience now feels like a premium SaaS flow with stronger structure, softer surfaces, and better rhythm.
              </p>
              <div className="space-y-3">
                {[
                  'Clean two-step onboarding',
                  'Emergency contact can be skipped',
                  'Backend contract remains unchanged',
                ].map((item) => (
                  <div key={item} className="premium-chip w-fit">{item}</div>
                ))}
              </div>
            </div>
            <div className="premium-panel-strong max-w-md p-6">
              <p className="text-sm leading-relaxed text-slate-200">
                “The flow now communicates trust before asking for any sensitive detail.”
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Design review note</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">System redesign</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-6 py-10 lg:col-span-7 lg:px-10">
          <div className="w-full max-w-3xl">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-glow">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-headline text-xl font-semibold text-white">Safe-Era</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Create your account</p>
                </div>
              </div>
            </div>

            <ProgressBar currentStep={currentStep} />

            {errors.submit && (
              <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errors.submit}
              </div>
            )}

            <div className="premium-panel-strong p-6 md:p-8">
              {currentStep === 1 ? (
                <SignupStep1
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  onContinue={handleStep1Continue}
                  isLoading={isLoading}
                />
              ) : (
                <SignupStep2
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  onContinue={handleStep2Continue}
                  onSkip={handleStep2Skip}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
