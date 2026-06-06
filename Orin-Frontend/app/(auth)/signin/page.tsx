'use client';

import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { validateEmail, validatePassword, getFriendlyErrorMessage } from '@/lib/auth-helpers';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-pulse)' }} /></div>}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const confirmed = searchParams.get('confirmed');
  const authError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const { signIn, signInWithOAuth, user, initialized } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      // Use router.push for client-side navigation (no full page reload)
      router.push(redirectTo);
    }
  }, [user, initialized, redirectTo, router]);

  useEffect(() => {
    // Show OAuth errors from callback
    if (authError) {
      setError(errorDescription || 'Authentication failed. Please try again.');
    }
  }, [authError, errorDescription]);

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setSocialLoading(provider);
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(getFriendlyErrorMessage({ message: err?.message }));
      setSocialLoading(null);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setFieldErrors({ email: emailErr ?? undefined, password: passwordErr ?? undefined });
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(getFriendlyErrorMessage({ message: signInError.message, status: signInError.status }));
      setLoading(false);
      return;
    }

    // Redirect on success
    router.push(redirectTo);
  };

  if (!initialized) {
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
          Welcome back
        </h2>
        <p className="mt-2 text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
          Sign in to your Orin account to continue building your proof portfolio.
        </p>
      </div>

      {confirmed === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] p-3.5 text-sm" style={{ backgroundColor: 'var(--color-bg-emerald-light)', color: 'var(--color-bloom)', border: '1px solid rgba(11,171,119,0.2)' }}
        >
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <span>Email confirmed! You can now sign in.</span>
        </motion.div>
      )}

      {confirmed === 'reset' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-[var(--radius-md)] p-3.5 text-sm" style={{ backgroundColor: 'var(--color-bg-emerald-light)', color: 'var(--color-bloom)', border: '1px solid rgba(11,171,119,0.2)' }}
        >
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          <span>Password reset! You can now sign in with your new password.</span>
        </motion.div>
      )}

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

      <div className="mb-6 grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={socialLoading !== null || loading}
          className="group relative flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
        >
          {socialLoading === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-pulse)' }} />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          <span>Google</span>
        </motion.button>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => handleSocialLogin('github')}
          disabled={socialLoading !== null || loading}
          className="group relative flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md hover:bg-[var(--color-ink)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
        >
          {socialLoading === 'github' ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--color-pulse)' }} />
          ) : (
            <GithubIcon className="h-4 w-4" />
          )}
          <span>GitHub</span>
        </motion.button>
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
            or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            Email address
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Mail className="h-4 w-4 transition-colors" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
              onBlur={() => { const err = validateEmail(email); setFieldErrors((p) => ({ ...p, email: err ?? undefined })); }}
              required
              className={`block w-full rounded-[var(--radius-md)] border bg-white py-3 pl-10 pr-3.5 text-[15px] shadow-sm transition-all hover:border-slate-300 focus:outline-none focus:ring-4 ${fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              style={{ borderColor: fieldErrors.email ? undefined : 'var(--color-border)', color: 'var(--color-ink)' }}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
            Password
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Lock className="h-4 w-4 transition-colors" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
              onBlur={() => { const err = validatePassword(password); setFieldErrors((p) => ({ ...p, password: err ?? undefined })); }}
              required
              className={`block w-full rounded-[var(--radius-md)] border bg-white py-3 pl-10 pr-11 text-[15px] shadow-sm transition-all hover:border-slate-300 focus:outline-none focus:ring-4 ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
              style={{ borderColor: fieldErrors.password ? undefined : 'var(--color-border)', color: 'var(--color-ink)' }}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors" style={{ color: 'var(--color-text-tertiary)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link
            href="/reset-password"
            className="text-sm font-medium transition-colors" style={{ color: 'var(--color-pulse)' }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary relative mt-2 flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-[var(--radius-md)] disabled:cursor-not-allowed disabled:opacity-70"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing you in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Don&rsquo;t have an account?{' '}
        <Link href="/signup" className="font-semibold transition-colors" style={{ color: 'var(--color-pulse)' }}>
          Create one for free
        </Link>
      </p>

      <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        Protected by industry-standard encryption.{' '}
        <Link href="#" className="underline-offset-2 hover:underline">Privacy</Link>
        &middot;
        <Link href="#" className="underline-offset-2 hover:underline">Terms</Link>
      </p>
    </motion.div>
  );
}

function GoogleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function GithubIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
