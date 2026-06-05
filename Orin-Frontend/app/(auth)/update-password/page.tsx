'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { getFriendlyErrorMessage, evaluatePasswordStrength } from '@/lib/auth-helpers';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/signin');
        return;
      }
      setSessionReady(true);
    });
  }, [router]);

  const passwordStrength = password ? evaluatePasswordStrength(password) : null;
  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!supabase) { setError('Auth not configured'); return; }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(getFriendlyErrorMessage(error));
      setLoading(false);
      return;
    }

    router.push('/signin?confirmed=reset');
  };

  if (!sessionReady) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-pulse)' }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
          Set new password
        </h2>
        <p className="mt-2 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] p-3.5 text-sm" style={{ backgroundColor: 'var(--color-bg-pulse-light)', color: 'var(--color-pulse)', border: '1px solid rgba(238,66,102,0.2)' }}
        >
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            New password
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5" style={{ color: 'var(--color-text-tertiary)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(passwordStrength!.score / 6) * 100}%`, backgroundColor: 'var(--color-bloom)' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{passwordStrength?.label}</span>
              </div>
              <ul className="space-y-1">
                {passwordChecks.map((check) => (
                  <li key={check.label} className="flex items-center gap-2 text-xs">
                    {check.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--color-bloom)' }} />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" style={{ color: 'var(--color-mist)' }} />
                    )}
                    <span style={{ color: check.met ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }}>{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ borderColor: 'var(--color-border)' }}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary relative mt-2 flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-[var(--radius-md)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating password...</span>
            </>
          ) : (
            <>
              <span>Update password</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
