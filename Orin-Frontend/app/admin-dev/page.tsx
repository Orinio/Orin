'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/admin-dev/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) router.replace('/admin-dev');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin-dev/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      router.replace('/admin-dev');
    } catch {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-ink)' }}>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-ink)' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: 'var(--color-pulse)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        />
      </div>

      <div
        className="relative w-full max-w-md rounded-[var(--radius-2xl)] p-8 shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4" style={{ backgroundColor: 'var(--color-pulse)', color: '#fff' }}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Admin Access
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            ORIN Admin Panel
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Authorized personnel only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-ink)' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm border outline-none transition-all focus:ring-2"
              style={{
                backgroundColor: 'var(--color-paper)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
              }}
              placeholder="Enter admin username"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-ink)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm border outline-none transition-all focus:ring-2"
              style={{
                backgroundColor: 'var(--color-paper)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
              }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium"
              style={{ backgroundColor: 'rgba(238,66,102,0.1)', color: 'var(--color-pulse)' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 rounded-[var(--radius-md)] text-sm font-bold transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-ink)',
              color: '#fff',
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
          This area is restricted to authorized administrators.
        </p>
      </div>
    </div>
  );
}
