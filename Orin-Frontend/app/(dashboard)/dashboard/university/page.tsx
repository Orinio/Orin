'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  BarChart3,
  Shield,
  TrendingUp,
  Loader2,
  ExternalLink,
  Download,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface UniversityStats {
  totalStudents: number;
  activeStudents: number;
  totalProofs: number;
  verifiedProofs: number;
  avgConfidenceScore: number;
  topSkills: Array<{ skill: string; count: number }>;
  recentActivity: Array<{
    studentName: string;
    action: string;
    timestamp: string;
  }>;
}

export default function UniversityPage() {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<UniversityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    const fetchUniversityData = async () => {
      if (!supabase || !authUser) return;

      try {
        // Check user plan
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();

        if (profile) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', profile.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          setUserPlan(sub?.plan || 'free');

          // Mock university stats (would come from real data in production)
          setStats({
            totalStudents: 247,
            activeStudents: 189,
            totalProofs: 1432,
            verifiedProofs: 892,
            avgConfidenceScore: 73,
            topSkills: [
              { skill: 'React', count: 89 },
              { skill: 'Python', count: 76 },
              { skill: 'JavaScript', count: 71 },
              { skill: 'TypeScript', count: 54 },
              { skill: 'Node.js', count: 48 },
            ],
            recentActivity: [
              { studentName: 'Sarah Chen', action: 'Added 3 new proof cards', timestamp: '2 hours ago' },
              { studentName: 'Marcus Johnson', action: 'Verified GitHub repository', timestamp: '4 hours ago' },
              { studentName: 'Emily Rodriguez', action: 'Completed skill gap analysis', timestamp: '6 hours ago' },
              { studentName: 'David Kim', action: 'Shared proof card with recruiter', timestamp: '8 hours ago' },
            ],
          });
        }
      } catch (err) {
        console.error('Failed to fetch university data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityData();
  }, [authUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  if (userPlan !== 'team' && userPlan !== 'university') {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <h1
            className="text-2xl font-semibold flex items-center gap-3"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
          >
            <GraduationCap className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
            University Dashboard
          </h1>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-bloom)15' }}
          >
            <GraduationCap className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
            University Partners
          </h2>
          <p className="mt-2 text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            The University Dashboard helps career services track student outcomes, verify skills at scale, and provide data-driven career guidance.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-left max-w-sm mx-auto">
            {[
              'Track student skill development',
              'Bulk verification for cohorts',
              'Outcome analytics and reporting',
              'Career services integration',
              'Student engagement metrics',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0" style={{ color: 'var(--color-bloom)' }} />
                <span style={{ color: 'var(--color-ink)' }}>{feature}</span>
              </li>
            ))}
          </ul>
          <a
            href="/dashboard/billing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          >
            Upgrade to University Plan
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-3"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
          >
            <GraduationCap className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
            University Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Track student outcomes and career readiness.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-ink)',
          }}
        >
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'var(--color-bloom)' },
          { label: 'Active Students', value: stats?.activeStudents || 0, icon: TrendingUp, color: 'var(--color-ember)' },
          { label: 'Total Proofs', value: stats?.totalProofs || 0, icon: Shield, color: 'var(--color-pulse)' },
          { label: 'Verified Proofs', value: stats?.verifiedProofs || 0, icon: BarChart3, color: 'var(--color-spark)' },
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
        {/* Top Skills */}
        <div className="lg:col-span-2 card-premium p-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Top Student Skills
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Most common skills across all student proof cards.
          </p>

          <div className="mt-4 space-y-3">
            {stats?.topSkills.map((skill, i) => (
              <div key={skill.skill} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)', width: 20 }}>
                    {i + 1}.
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {skill.skill}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(skill.count / (stats?.topSkills[0]?.count || 1)) * 100}%`,
                        backgroundColor: 'var(--color-bloom)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)', width: 40 }}>
                    {skill.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-premium p-6">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Recent Activity
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Latest student actions.
          </p>

          <div className="mt-4 space-y-3">
            {stats?.recentActivity.map((activity, i) => (
              <div
                key={i}
                className="p-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-surface-dim)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                  {activity.studentName}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {activity.action}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {activity.timestamp}
                </p>
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
            { label: 'View All Students', href: '#', icon: Users },
            { label: 'Bulk Verification', href: '#', icon: Shield },
            { label: 'Generate Report', href: '#', icon: BarChart3 },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
