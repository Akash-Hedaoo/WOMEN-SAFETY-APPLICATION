import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Radio, Shield } from 'lucide-react';
import { API_BASE_URL, ROUTES } from '../utils/constants';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();

      if (!response.ok || !data.success || data.user?.role !== 'admin') {
        throw new Error(data.message || 'Admin sign-in failed.');
      }

      localStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(ROUTES.ADMIN, { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Cannot connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center bg-[#FAF0EA] p-6">
      <div className="w-full max-w-md">
        <Link to={ROUTES.LOGIN} className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C62828] shadow-sm">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-headline text-xl font-semibold text-[#28302A]">Safe-Era Admin</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#687067]">ICCC access only</p>
          </div>
        </Link>

        <div className="premium-panel-strong p-8 md:p-10">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C62828]/10 text-[#C62828]">
              <Shield className="h-6 w-6" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#C62828]">Restricted access</p>
            <h1 className="mt-3 font-headline text-3xl font-semibold text-[#28302A]">ICCC Command Center</h1>
            <p className="mt-3 text-sm text-[#687067]">This account can access the command center only.</p>
          </div>

          {error && <div className="mb-6 rounded-2xl border border-[#C62828]/30 bg-[#C62828]/10 px-4 py-3 text-sm text-[#C62828]">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="premium-label">Admin email</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687067]" />
                <input className="premium-input pl-11" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
            </label>
            <label className="block">
              <span className="premium-label">Password</span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687067]" />
                <input className="premium-input pl-11 pr-11" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#687067] hover:bg-[#FAF8F5]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <button className="btn-primary w-full justify-center" type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Open command center'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
