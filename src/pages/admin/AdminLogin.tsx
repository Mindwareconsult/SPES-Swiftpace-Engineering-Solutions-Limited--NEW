import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { SEOHead } from '../../components/common/SEOHead';

export const AdminLogin: React.FC = () => {
  const { isAuthenticated, isLoading, statusInfo, login, claimInitialPassword } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('spesadmin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (statusInfo?.configuredUsername) {
      setUsername(statusInfo.configuredUsername);
    }
  }, [statusInfo?.configuredUsername]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const needsClaim = Boolean(statusInfo?.needsClaim);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (needsClaim) {
      if (password.length < 8) {
        setError('Please choose a password of at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setSubmitting(true);
      try {
        await claimInitialPassword(username, password);
        navigate('/admin/dashboard', { replace: true });
      } catch (err: any) {
        setError(err?.message || 'Unable to save initial administrator password.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06142B] text-slate-100 flex items-center justify-center px-4 py-12 blueprint-grid">
      <SEOHead title="Administrator Sign In | SPES Swiftpace CMS" noIndex />

      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#12BCEB]"
          >
            <ArrowLeft className="w-4 h-4" /> Public Website
          </Link>
          <span className="font-mono-tech text-[11px] text-slate-400">
            CMS Mode: {statusInfo?.cmsMode === 'github' ? 'GitHub' : 'Local Preview'}
          </span>
        </div>

        <div className="p-8 rounded-2xl border border-white/15 bg-[#0B1E3D] space-y-6 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3.5">
            <BrandLogo sizeClass="w-12 h-12" />
            <div>
              <h1 className="font-editorial text-2xl font-semibold text-white">
                {needsClaim ? 'Initial Admin Setup' : 'Administrator Portal'}
              </h1>
              <p className="text-xs text-slate-400">
                SPES Swiftpace GitHub-Backed Content Manager
              </p>
            </div>
          </div>

          {needsClaim ? (
            <div className="p-4 rounded-lg border border-[#12BCEB]/30 bg-[#12BCEB]/10 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#12BCEB] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                No <code className="font-mono-tech">ADMIN_PASSWORD_HASH</code> environment variable is set yet. Create your initial administrator password below to access the dashboard.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-white/10 bg-[#06142B] text-xs text-slate-400 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#078A43] shrink-0" aria-hidden="true" />
              <span>Protected with signed HttpOnly session authentication.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3.5 rounded-lg border border-red-500/40 bg-red-500/10 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-username" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Administrator Username
              </label>
              <input
                id="admin-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {needsClaim ? 'Create Password (min 8 characters)' : 'Password'}
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={needsClaim ? 'new-password' : 'current-password'}
                className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
              />
            </div>

            {needsClaim && (
              <div className="space-y-1.5">
                <label htmlFor="admin-confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Confirm Password
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-white/15 bg-[#06142B] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#12BCEB]"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#12BCEB] hover:bg-[#29caf7] disabled:opacity-60 text-[#06142B] px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Lock className="w-4 h-4" />
              {submitting
                ? 'Authenticating...'
                : needsClaim
                  ? 'Save Password & Enter Dashboard'
                  : 'Sign In to CMS'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
