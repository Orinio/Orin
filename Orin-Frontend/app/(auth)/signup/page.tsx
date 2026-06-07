'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';
import {
  validateEmail,
  validateName,
  validateSignUpPassword,
  getFriendlyErrorMessage,
  evaluatePasswordStrength,
} from '@/lib/auth-helpers';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithOAuth, user, initialized } = useAuth();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialized) return;
    if (user) router.push('/dashboard');
  }, [user, initialized, router]);

  const passwordStrength = password ? evaluatePasswordStrength(password) : null;

  const passwordChecks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const nameErr = validateName(fullName);
    const emailErr = validateEmail(email);
    const passErr = validateSignUpPassword(password);
    if (nameErr) errors.fullName = nameErr;
    if (emailErr) errors.email = emailErr;
    if (passErr) errors.password = passErr;
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!agreeTerms) errors.terms = 'You must agree to the terms.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(getFriendlyErrorMessage(error));
      setLoading(false);
      return;
    }

    setSuccess('Account created! Check your email for a confirmation link.');
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setSocialLoading(provider);
    setError(null);
    await signInWithOAuth(provider);
    setSocialLoading(null);
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-pulse)' }} />
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="rounded-[var(--radius-xl)] p-8 text-center" style={{ backgroundColor: 'var(--color-bg-emerald-light)', border: '1px solid rgba(11,171,119,0.2)' }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(11,171,119,0.15)' }}>
            <svg className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Check your inbox</h3>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-mist)' }}>{success}</p>
          <Link
            href="/signin"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-md)]"
          >
            Go to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
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
          Create Account
        </h2>
        <p className="mt-2 text-[15px]" style={{ color: 'var(--color-mist)' }}>
          Set up your profile to start building and sharing verified career proof.
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

      {!showEmailForm ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading !== null || loading}
              className="group relative flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', backgroundColor: 'var(--color-surface)' }}
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
              className="group relative flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', backgroundColor: 'var(--color-surface)' }}
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
              <span className="px-3" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-mist)' }}>or continue with</span>
            </div>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="btn-primary group relative flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-[var(--radius-md)]"
          >
            <span>Continue with Email</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>

          <p className="mt-7 text-center text-sm" style={{ color: 'var(--color-mist)' }}>
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold transition-colors" style={{ color: 'var(--color-pulse)' }}>
              Sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Full name
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <User className="h-4 w-4" style={{ color: 'var(--color-mist)' }} />
              </div>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors((p) => ({ ...p, fullName: '' })); }}
                required
                className={`pl-10 ${fieldErrors.fullName ? 'border-[var(--color-pulse)]' : ''}`}
                style={{ borderColor: fieldErrors.fullName ? 'var(--color-pulse)' : 'var(--color-border)' }}
                aria-invalid={!!fieldErrors.fullName}
              />
            </div>
            {fieldErrors.fullName && <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Email address
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-4 w-4" style={{ color: 'var(--color-mist)' }} />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                required
                className={`pl-10 ${fieldErrors.email ? 'border-[var(--color-pulse)]' : ''}`}
                style={{ borderColor: fieldErrors.email ? 'var(--color-pulse)' : 'var(--color-border)' }}
                aria-invalid={!!fieldErrors.email}
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Password
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4" style={{ color: 'var(--color-mist)' }} />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                required
                className={`pl-10 ${fieldErrors.password ? 'border-[var(--color-pulse)]' : ''}`}
                style={{ borderColor: fieldErrors.password ? 'var(--color-pulse)' : 'var(--color-border)' }}
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5" style={{ color: 'var(--color-mist)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.password}</p>}

            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                    <div className={`h-full rounded-full transition-all ${passwordStrength?.color}`} style={{ width: `${(passwordStrength!.score / 6) * 100}%`, backgroundColor: 'var(--color-bloom)' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-mist)' }}>{passwordStrength?.label}</span>
                </div>
                <ul className="space-y-1">
                  {passwordChecks.map((check) => (
                    <li key={check.label} className="flex items-center gap-2 text-xs">
                      {check.met ? (
                        <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--color-bloom)' }} />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" style={{ color: 'var(--color-mist)' }} />
                      )}
                      <span style={{ color: check.met ? 'var(--color-bloom)' : 'var(--color-mist)' }}>{check.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Confirm password
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-4 w-4" style={{ color: 'var(--color-mist)' }} />
              </div>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: '' })); }}
                required
                className={`pl-10 ${fieldErrors.confirmPassword ? 'border-[var(--color-pulse)]' : ''}`}
                style={{ borderColor: fieldErrors.confirmPassword ? 'var(--color-pulse)' : 'var(--color-border)' }}
                aria-invalid={!!fieldErrors.confirmPassword}
              />
            </div>
            {fieldErrors.confirmPassword && <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.confirmPassword}</p>}
            {confirmPassword && password !== confirmPassword && !fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="group flex cursor-pointer items-start gap-3 pt-1">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => { setAgreeTerms(e.target.checked); setFieldErrors((p) => ({ ...p, terms: '' })); }}
                  className="peer sr-only"
                />
                <div className={`h-[18px] w-[18px] rounded-[var(--radius-sm)] border-2 bg-[var(--color-surface)] transition-all peer-checked:border-[var(--color-bloom)] peer-checked:bg-[var(--color-bloom)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-bloom)]/30 group-hover:border-[var(--color-mist)] ${fieldErrors.terms ? 'border-[var(--color-pulse)]' : ''}`} style={{ borderColor: fieldErrors.terms ? undefined : 'var(--color-border)' }} />
                <svg className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm" style={{ color: 'var(--color-mist)' }}>
                I agree to the{' '}
                <Link href="#" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--color-pulse)' }}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="font-medium underline-offset-2 hover:underline" style={{ color: 'var(--color-pulse)' }}>Privacy Policy</Link>
              </span>
            </label>
            {fieldErrors.terms && <p className="mt-1 text-xs" style={{ color: 'var(--color-pulse)' }}>{fieldErrors.terms}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary relative mt-2 flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-[var(--radius-md)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowEmailForm(false)}
            className="btn-outline mt-3 w-full px-4 py-3 text-sm font-semibold rounded-[var(--radius-md)]"
          >
            Back
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-mist)' }}>
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
