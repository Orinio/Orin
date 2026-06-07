'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AdminStats {
  stats: {
    totalUsers: number;
    totalProofs: number;
    totalOpportunities: number;
    totalMessages: number;
    verifiedProofs: number;
    pendingProofs: number;
    activeUsers: number;
  };
  recentUsers: Array<{ id: string; email: string; username: string; full_name: string | null; role: string; account_status: string; created_at: string }>;
  recentProofs: Array<{ id: string; title: string; verification_status: string; source_type: string; created_at: string }>;
}

export default function AdminDevPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-dev/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) {
          setAuthenticated(true);
          setUsername(d.username || '');
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin-dev/stats');
      const d = await res.json();
      setData(d);
    } catch {} finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchStats();
  }, [authenticated, fetchStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin-dev/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Auth failed'); setLoading(false); return; }
      setAuthenticated(true);
      setUsername(d.username || '');
    } catch { setError('Connection failed'); setLoading(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/admin-dev/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setUsername('');
    setData(null);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-ink)' }} />
      </div>
    );
  }

  /* ─── LOGIN ─── */
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4" style={{ backgroundColor: 'var(--color-pulse)', color: '#fff' }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Admin Access
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>ORIN Admin Panel</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 card-base p-6">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-ink)' }}>Username</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username"
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm border outline-none"
                style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-ink)' }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm border outline-none"
                style={{ backgroundColor: 'var(--color-paper)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
              />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-[var(--radius-md)] text-sm font-medium" style={{ backgroundColor: 'rgba(238,66,102,0.1)', color: 'var(--color-pulse)' }}>
                {error}
              </div>
            )}
            <button
              type="submit" disabled={loading || !username || !password}
              className="w-full py-3 rounded-[var(--radius-md)] text-sm font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-ink)', color: '#fff' }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ─── DASHBOARD ─── */
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-ink)' }} />
      </div>
    );
  }

  const statCards = data ? [
    { label: 'Total Users', value: data.stats.totalUsers, color: 'var(--color-bloom)', href: '/admin-dev/users' },
    { label: 'Active Users', value: data.stats.activeUsers, color: 'var(--color-ink)', href: '/admin-dev/users' },
    { label: 'Total Proofs', value: data.stats.totalProofs, color: 'var(--color-ember)', href: '/admin-dev/proofs' },
    { label: 'Pending Review', value: data.stats.pendingProofs, color: 'var(--color-pulse)', href: '/admin-dev/proofs' },
    { label: 'Verified Proofs', value: data.stats.verifiedProofs, color: 'var(--color-bloom)', href: '/admin-dev/proofs' },
    { label: 'Opportunities', value: data.stats.totalOpportunities, color: 'var(--color-spark)', href: '/admin-dev/opportunities' },
    { label: 'Messages', value: data.stats.totalMessages, color: 'var(--color-pulse)', href: '/admin-dev/messages' },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Welcome back, <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{username}</span>
          </p>
        </div>
        <button type="button" onClick={handleLogout} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ color: 'var(--color-pulse)' }}>
          Sign Out
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="card-base p-5 group">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>{card.label}</p>
            <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Recent Users</h2>
            <Link href="/admin-dev/users" className="text-xs font-semibold" style={{ color: 'var(--color-bloom)' }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {(data?.recentUsers || []).map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                  {(user.username || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{user.username || user.email}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>{user.email}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{
                  backgroundColor: user.role === 'admin' ? 'rgba(238,66,102,0.1)' : 'rgba(11,171,119,0.1)',
                  color: user.role === 'admin' ? 'var(--color-pulse)' : 'var(--color-bloom)',
                }}>
                  {user.role === 'admin' ? 'Admin' : user.account_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Proofs */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Recent Proofs</h2>
            <Link href="/admin-dev/proofs" className="text-xs font-semibold" style={{ color: 'var(--color-bloom)' }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {(data?.recentProofs || []).map((proof) => (
              <div key={proof.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{
                  backgroundColor: proof.verification_status === 'verified' ? 'rgba(11,171,119,0.1)' : 'rgba(246,146,38,0.1)',
                  color: proof.verification_status === 'verified' ? 'var(--color-bloom)' : 'var(--color-ember)',
                }}>
                  {proof.source_type.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{proof.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{proof.source_type}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{
                  backgroundColor: proof.verification_status === 'verified' ? 'rgba(11,171,119,0.1)' : 'rgba(246,146,38,0.1)',
                  color: proof.verification_status === 'verified' ? 'var(--color-bloom)' : 'var(--color-ember)',
                }}>
                  {proof.verification_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-base p-5">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-ink)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Manage Users', href: '/admin-dev/users', icon: 'M12 4.354a4 4 0 110 7.292 4 4 0 010-7.292z' },
            { label: 'Review Proofs', href: '/admin-dev/proofs', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { label: 'Audit Log', href: '/admin-dev/audit', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { label: 'Settings', href: '/admin-dev/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border transition-all hover:shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink)' }}>
                <path d={action.icon} />
              </svg>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
