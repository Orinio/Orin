'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import { validateEmail, getFriendlyErrorMessage } from '@/lib/auth-helpers';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldError(emailErr);
      return;
    }
    setFieldError(null);
    setLoading(true);
    setError(null);

    const { error } = await resetPassword(email);

    if (error) {
      setError(getFriendlyErrorMessage(error));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
          Reset Password
        </h2>
        <p className="mt-2 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
          {sent
            ? 'If an account exists with that email, we&apos;ve sent a reset link.'
            : 'Enter your email and we&apos;ll send you a secure reset link.'}
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

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="rounded-[var(--radius-md)] p-4 text-sm" style={{ backgroundColor: 'var(--color-bg-emerald-light)', color: 'var(--color-bloom)', border: '1px solid rgba(11,171,119,0.2)' }}>
            <p className="font-medium">Check your email inbox.</p>
            <p className="mt-1" style={{ opacity: 0.8 }}>The reset link expires in 1 hour. Didn&apos;t receive it? Check your spam folder.</p>
          </div>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="btn-outline w-full px-4 py-3 text-sm font-semibold rounded-[var(--radius-md)]"
          >
            Send again
          </button>
          <Link
            href="/signin"
            className="mt-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--color-pulse)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Email address
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldError(null); }}
                required
                className={`pl-10 ${fieldError ? 'border-red-300' : ''}`}
                style={{ borderColor: fieldError ? undefined : 'var(--color-border)' }}
                aria-invalid={!!fieldError}
              />
            </div>
            {fieldError && <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary relative mt-2 flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-[var(--radius-md)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending reset link...</span>
              </>
            ) : (
              <>
                <span>Send reset link</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <Link
            href="/signin"
            className="mt-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </motion.div>
  );
}
