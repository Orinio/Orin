'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  BarChart3,
  TrendingUp,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface ModeratorStats {
  pendingReviews: number;
  flaggedContent: number;
  resolvedToday: number;
  totalUsers: number;
  recentFlags: Array<{
    id: string;
    type: string;
    reason: string;
    reportedBy: string;
    createdAt: string;
    status: string;
  }>;
}

export default function ModeratorDashboard() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<ModeratorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModeratorData = async () => {
      if (!supabase || !authUser) return;

      try {
        const [usersRes, proofsRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('proof_cards').select('id, verification_status', { count: 'exact' }),
        ]);

        const totalUsers = usersRes.count || 0;
        const flaggedContent = proofsRes.data?.filter(p => p.verification_status === 'flagged').length || 0;

        // Fetch recent flags (mock data - in production would come from a flags table)
        const recentFlags = [
          { id: '1', type: 'proof', reason: 'Suspicious activity', reportedBy: 'System', createdAt: '2 hours ago', status: 'pending' },
          { id: '2', type: 'user', reason: 'Spam account', reportedBy: 'User report', createdAt: '4 hours ago', status: 'pending' },
          { id: '3', type: 'proof', reason: 'Plagiarism detected', reportedBy: 'AI scan', createdAt: '6 hours ago', status: 'resolved' },
        ];

        setStats({
          pendingReviews: Math.floor(flaggedContent * 0.6),
          flaggedContent,
          resolvedToday: 12,
          totalUsers,
          recentFlags,
        });
      } catch (err) {
        console.error('Failed to fetch moderator data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModeratorData();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-ember)' }}>
          Moderator Dashboard
        </p>
        <h1 className="text-3xl font-semibold md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
          Content Moderation
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Review flagged content and manage user reports.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pending Reviews', value: stats?.pendingReviews || 0, icon: Eye, color: 'var(--color-ember)' },
          { label: 'Flagged Content', value: stats?.flaggedContent || 0, icon: AlertTriangle, color: 'var(--color-pulse)' },
          { label: 'Resolved Today', value: stats?.resolvedToday || 0, icon: CheckCircle, color: 'var(--color-bloom)' },
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'var(--color-spark)' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card-premium p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  {stat.label}
                </span>
                <Icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
                {stat.value.toLocaleString()}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Flags */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Recent Flags
          </h2>
          <Link href="/dashboard/moderator/flags" className="text-sm font-medium" style={{ color: 'var(--color-bloom)' }}>
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {stats?.recentFlags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.01]"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: flag.status === 'pending' ? 'var(--color-ember)12' : 'var(--color-bloom)12',
                  }}
                >
                  {flag.status === 'pending' ? (
                    <AlertTriangle className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
                  ) : (
                    <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)} flagged
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {flag.reason} · {flag.reportedBy}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: flag.status === 'pending' ? 'var(--color-ember)12' : 'var(--color-bloom)12',
                    color: flag.status === 'pending' ? 'var(--color-ember)' : 'var(--color-bloom)',
                  }}
                >
                  {flag.status}
                </span>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {flag.createdAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: 'Review Queue', href: '/dashboard/moderator/queue', icon: Eye },
            { label: 'User Reports', href: '/dashboard/moderator/reports', icon: Users },
            { label: 'Content Flags', href: '/dashboard/moderator/flags', icon: AlertTriangle },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
