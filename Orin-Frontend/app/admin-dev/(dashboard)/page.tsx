'use client';

import { useState, useEffect } from 'react';
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

export default function AdminDashboard() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-dev/stats')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-ink)' }} />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Failed to load dashboard data.</div>;
  }

  const statCards = [
    { label: 'Total Users', value: data.stats.totalUsers, color: 'var(--color-bloom)', href: '/admin-dev/users' },
    { label: 'Active Users', value: data.stats.activeUsers, color: 'var(--color-ink)', href: '/admin-dev/users' },
    { label: 'Total Proofs', value: data.stats.totalProofs, color: 'var(--color-ember)', href: '/admin-dev/proofs' },
    { label: 'Pending Verification', value: data.stats.pendingProofs, color: 'var(--color-pulse)', href: '/admin-dev/proofs' },
    { label: 'Verified Proofs', value: data.stats.verifiedProofs, color: 'var(--color-bloom)', href: '/admin-dev/proofs' },
    { label: 'Opportunities', value: data.stats.totalOpportunities, color: 'var(--color-spark)', href: '/admin-dev/opportunities' },
    { label: 'Contact Messages', value: data.stats.totalMessages, color: 'var(--color-pulse)', href: '/admin-dev/messages' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Overview of all system data and recent activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="card-base p-5 group"
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
              {card.label}
            </p>
            <p className="text-3xl font-bold" style={{ color: card.color }}>
              {card.value.toLocaleString()}
            </p>
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
            {data.recentUsers.map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                >
                  {(user.username || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                    {user.username || user.email}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                    {user.email}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: user.role === 'admin' ? 'rgba(238,66,102,0.1)' : user.account_status === 'active' ? 'rgba(11,171,119,0.1)' : 'rgba(100,116,139,0.1)',
                    color: user.role === 'admin' ? 'var(--color-pulse)' : user.account_status === 'active' ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                  }}
                >
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
            {data.recentProofs.map((proof) => (
              <div key={proof.id} className="px-5 py-3 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: proof.verification_status === 'verified' ? 'rgba(11,171,119,0.1)' : proof.verification_status === 'pending' ? 'rgba(246,146,38,0.1)' : 'rgba(100,116,139,0.1)',
                    color: proof.verification_status === 'verified' ? 'var(--color-bloom)' : proof.verification_status === 'pending' ? 'var(--color-ember)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {proof.source_type.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                    {proof.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {proof.source_type}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: proof.verification_status === 'verified' ? 'rgba(11,171,119,0.1)' : proof.verification_status === 'pending' ? 'rgba(246,146,38,0.1)' : 'rgba(238,66,102,0.1)',
                    color: proof.verification_status === 'verified' ? 'var(--color-bloom)' : proof.verification_status === 'pending' ? 'var(--color-ember)' : 'var(--color-pulse)',
                  }}
                >
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
            { label: 'View Audit Log', href: '/admin-dev/audit', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label: 'Messages', href: '/admin-dev/messages', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border transition-all hover:shadow-md"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            >
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
