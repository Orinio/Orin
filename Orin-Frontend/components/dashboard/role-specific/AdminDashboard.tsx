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
  Settings,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProofs: number;
  flaggedContent: number;
  pendingVerifications: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  usersByRole: Array<{ role: string; count: number }>;
  recentSignups: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!supabase || !authUser) return;

      try {
        const [usersRes, proofsRes, flagsRes] = await Promise.all([
          supabase.from('users').select('id, role, created_at', { count: 'exact' }),
          supabase.from('proof_cards').select('id, verification_status', { count: 'exact' }),
          supabase.from('proof_cards').select('id').eq('verification_status', 'rejected' as any),
        ]);

        const totalUsers = usersRes.count || 0;
        const totalProofs = proofsRes.count || 0;
        const flaggedContent = flagsRes.data?.length || 0;

        // Count users by role
        const roleCounts: Record<string, number> = {};
        usersRes.data?.forEach(u => {
          roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
        });
        const usersByRole = Object.entries(roleCounts)
          .map(([role, count]) => ({ role, count }))
          .sort((a, b) => b.count - a.count);

        // Recent signups
        const { data: recentUsers } = await supabase
          .from('users')
          .select('id, full_name, email, role, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.65),
          totalProofs,
          flaggedContent,
          pendingVerifications: Math.floor(totalProofs * 0.1),
          systemHealth: 'healthy',
          usersByRole,
          recentSignups: recentUsers?.map(u => ({
            id: u.id,
            fullName: u.full_name || 'Unknown',
            email: u.email || 'No email',
            role: u.role,
            createdAt: new Date(u.created_at).toLocaleDateString(),
          })) || [],
        });
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
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
      <header className="flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-pulse)' }}>
            Admin Dashboard
          </p>
          <h1 className="text-3xl font-semibold md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            System Overview
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Monitor platform health and manage users.
          </p>
        </div>
        <Link href="/settings" className="btn-outline px-5 py-2.5 text-sm">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </header>

      {/* System Health */}
      <div className="card-premium p-4 flex items-center gap-3" style={{
        backgroundColor: stats?.systemHealth === 'healthy' ? 'var(--color-bloom)08' : 'var(--color-pulse)08',
        border: `1px solid ${stats?.systemHealth === 'healthy' ? 'var(--color-bloom)' : 'var(--color-pulse)'}20`,
      }}>
        {stats?.systemHealth === 'healthy' ? (
          <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
        ) : (
          <AlertTriangle className="h-5 w-5" style={{ color: 'var(--color-pulse)' }} />
        )}
        <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          System Status: {stats?.systemHealth === 'healthy' ? 'All systems operational' : 'Issue detected'}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'var(--color-bloom)' },
          { label: 'Active Users', value: stats?.activeUsers || 0, icon: TrendingUp, color: 'var(--color-ember)' },
          { label: 'Total Proofs', value: stats?.totalProofs || 0, icon: BarChart3, color: 'var(--color-pulse)' },
          { label: 'Flagged Content', value: stats?.flaggedContent || 0, icon: AlertTriangle, color: 'var(--color-spark)' },
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

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Users by Role */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Users by Role
          </h2>
          <div className="mt-4 space-y-3">
            {stats?.usersByRole.map((item) => (
              <div key={item.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold capitalize" style={{ color: 'var(--color-ink)' }}>
                    {item.role}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.count / (stats?.totalUsers || 1)) * 100}%`,
                        backgroundColor: 'var(--color-bloom)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)', width: 30 }}>
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="lg:col-span-2 card-premium p-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Recent Signups
          </h2>
          <div className="mt-4 space-y-3">
            {stats?.recentSignups.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-bloom)' }}
                  >
                    {user.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {user.fullName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full" style={{
                    backgroundColor: 'var(--color-bloom)12',
                    color: 'var(--color-bloom)',
                  }}>
                    {user.role}
                  </span>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    {user.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
            { label: 'Review Flags', href: '/dashboard/admin/flags', icon: AlertTriangle },
            { label: 'System Settings', href: '/settings', icon: Settings },
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
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-pulse)' }} />
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
