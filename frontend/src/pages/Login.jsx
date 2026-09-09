import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { ROUTES, API_BASE_URL } from '../utils/constants';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('authToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        navigate(ROUTES.DASHBOARD);
      } else if (data.requiresVerification) {
        setError('Please verify your email first. Check your inbox for the OTP.');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.name === 'AbortError'
        ? 'Server is waking up. Please wait a moment and try again.'
        : 'Cannot connect to server. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen overflow-hidden bg-[#FAF0EA]">
      <div className="relative grid min-h-screen lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl">
            <Link to={ROUTES.HOME} className="mb-8 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7A8E72] shadow-sm">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-headline text-xl font-semibold text-[#28302A]">Safe-Era</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#687067]">Secure access</p>
              </div>
            </Link>

            <div className="premium-panel-strong p-8 md:p-10">
              <div className="mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7A8E72]">Welcome back</p>
                <h1 className="mt-3 font-headline text-4xl font-semibold text-[#28302A]">Sign in to your control center</h1>
                <p className="mt-3 text-[#687067]">Access your safety dashboard, guardian network, and emergency tools.</p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-[#C62828]/30 bg-[#C62828]/10 px-4 py-3 text-sm text-[#C62828]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="premium-label">Email address</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687067]" />
                    <input
                      className="premium-input pl-11"
                      id="email"
                      placeholder="veda.menon@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="premium-label mb-0">Password</span>
                    <button type="button" className="text-xs font-semibold text-[#7A8E72] hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687067]" />
                    <input
                      className="premium-input pl-11 pr-11"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#687067] transition hover:bg-[#FAF8F5]"
                      type="button"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <button
                  className="btn-primary w-full justify-center"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-8 border-t border-[#DCDDD5] pt-6">
                <p className="text-sm text-[#687067]">
                  New here?{' '}
                  <Link className="font-semibold text-[#7A8E72] hover:underline" to={ROUTES.SIGNUP}>
                    Create a free account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden border-l border-[#DCDDD5] lg:block">
          <div className="absolute inset-0 bg-[url('/auth-illustration.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#FAF0EA]/95 via-[#FAF8F5]/90 to-[#FAF0EA]/95" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCDDD5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#28302A] shadow-sm">
              <Shield className="h-3.5 w-3.5 text-[#7A8E72]" />
              Privacy-first access
            </div>

            <div className="max-w-xl space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">Experience</p>
              <h2 className="font-headline text-5xl font-semibold leading-tight text-[#28302A]">
                A calm interface for urgent moments.
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-[#687067]">
                The design now prioritizes legibility, depth, and decisive controls so users can act quickly without visual friction.
              </p>
              <div className="flex flex-wrap gap-3">
                {['24/7 support', 'Encrypted', 'Fast sign-in'].map((pill) => (
                  <span key={pill} className="premium-chip">{pill}</span>
                ))}
              </div>
            </div>

            <div className="premium-panel-strong max-w-md p-6">
              <p className="text-sm leading-relaxed text-[#28302A]">
                “The product now feels like a premium safety workspace instead of a utilitarian form.”
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#7A8E72]" />
                <div>
                  <p className="text-sm font-semibold text-[#28302A]">Veda Menon</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#687067]">Solo traveler</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
