'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { BarChart3, TrendingUp, Eye, Shield, Plus, ExternalLink, ArrowUpRight, Calendar, Target, Flame } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { mapDbProofToProof, formatNumber } from '@/lib/utils';
import type { Proof } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

const PIE_COLORS = [
  'var(--color-bloom)',
  'var(--color-pulse)',
  'var(--color-ember)',
  'var(--color-spark)',
  '#6366f1',
  '#8b5cf6',
];

const VERIFICATION_COLORS: Record<string, string> = {
  verified: 'var(--color-bloom)',
  pending: 'var(--color-ember)',
  draft: '#94a3b8',
  rejected: 'var(--color-pulse)',
};

function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof BarChart3;
  color: string;
  trend?: number;
}) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}15)`,
        border: `1px solid ${color}20`,
      }}
      whileHover={{ scale: 1.02, boxShadow: `0 8px 30px ${color}15` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {trend !== undefined && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--color-bloom)' }}>
            <ArrowUpRight className="h-3 w-3" />
            {trend}%
          </span>
        )}
        {sub && <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

function SourceBreakdown({ proofs }: { proofs: Proof[] }) {
  const counts: Record<string, number> = {};
  proofs.forEach((p) => { counts[p.sourceType] = (counts[p.sourceType] || 0) + 1; });

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ name: type, value: count }));

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Source Breakdown</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No sources yet.</p>
      ) : (
        <div className="mt-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span style={{ color: 'var(--color-ink)', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function VerificationPie({ proofs }: { proofs: Proof[] }) {
  const counts: Record<string, number> = { verified: 0, pending: 0, draft: 0, rejected: 0 };
  proofs.forEach((p) => { counts[p.verificationStatus] = (counts[p.verificationStatus] || 0) + 1; });

  const data = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({ name: status, value: count }));

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Verification Status</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No verification data.</p>
      ) : (
        <div className="mt-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={VERIFICATION_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span style={{ color: 'var(--color-ink)', fontSize: 12, textTransform: 'capitalize' }}>{value}</span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function SkillChart({ proofs }: { proofs: Proof[] }) {
  const skillMap = new Map<string, number>();
  proofs.forEach((p) => {
    [...p.skillsExtracted, ...p.skillsUserAdded].forEach((s) => {
      skillMap.set(s, (skillMap.get(s) || 0) + 1);
    });
  });

  const data = Array.from(skillMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ name: skill, count }));

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Top Skills</h2>
      {data.length === 0 ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No skills data available yet.</p>
      ) : (
        <div className="mt-4" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--color-ink)' }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                maxBarSize={28}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={i % 2 === 0 ? 'var(--color-bloom)' : 'var(--color-bloom)CC'} />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function CareerProgressChart({ proofs }: { proofs: Proof[] }) {
  // Group proofs by month
  const monthlyData = new Map<string, { count: number; verified: number }>();
  
  proofs.forEach((p) => {
    const date = new Date(p.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyData.get(key) || { count: 0, verified: 0 };
    monthlyData.set(key, {
      count: existing.count + 1,
      verified: existing.verified + (p.verificationStatus === 'verified' ? 1 : 0),
    });
  });

  const data = Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, stats]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      proofs: stats.count,
      verified: stats.verified,
    }));

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Career Progress</h2>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
            Total Proofs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-pulse)' }} />
            Verified
          </span>
        </div>
      </div>
      {data.length < 2 ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Need at least 2 months of data to show progress.</p>
      ) : (
        <div className="mt-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorProofs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-bloom)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-bloom)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pulse)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-pulse)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="proofs"
                stroke="var(--color-bloom)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProofs)"
              />
              <Area
                type="monotone"
                dataKey="verified"
                stroke="var(--color-pulse)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVerified)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EngagementChart({ proofs }: { proofs: Proof[] }) {
  // Group views by day for last 30 days
  const dailyViews = new Map<string, number>();
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    dailyViews.set(key, 0);
  }

  proofs.forEach((p) => {
    // Simulate view distribution based on creation date
    const created = new Date(p.createdAt);
    const key = created.toISOString().split('T')[0];
    if (dailyViews.has(key)) {
      dailyViews.set(key, (dailyViews.get(key) || 0) + p.viewCount);
    }
  });

  const data = Array.from(dailyViews.entries())
    .map(([date, views]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views,
    }));

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Engagement (30 days)</h2>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          <Eye className="h-3.5 w-3.5" />
          {formatNumber(proofs.reduce((sum, p) => sum + p.viewCount, 0))} total views
        </div>
      </div>
      <div className="mt-4" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-ember)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-ember)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--color-ember)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StreakCard({ proofs }: { proofs: Proof[] }) {
  // Calculate current streak
  const sortedDates = [...new Set(
    proofs.map(p => new Date(p.createdAt).toISOString().split('T')[0])
  )].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    
    if (sortedDates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--color-ember)15' }}
        >
          <Flame className="h-6 w-6" style={{ color: 'var(--color-ember)' }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{streak}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Day streak</p>
        </div>
      </div>
      <p className="mt-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        {streak > 0 ? 'Keep it up! Add proofs daily to maintain your streak.' : 'Start a streak by adding proofs consistently!'}
      </p>
    </div>
  );
}

function GoalsProgressCard({ proofs }: { proofs: Proof[] }) {
  const verifiedCount = proofs.filter(p => p.verificationStatus === 'verified').length;
  const totalProofs = proofs.length;
  const goals = [
    { label: 'First 5 proofs', target: 5, current: totalProofs },
    { label: '50% verified', target: Math.ceil(totalProofs * 0.5), current: verifiedCount },
    { label: '10 skills', target: 10, current: new Set(proofs.flatMap(p => [...p.skillsExtracted, ...p.skillsUserAdded])).size },
    { label: '25 proofs', target: 25, current: totalProofs },
  ];

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Goals Progress</h2>
      <div className="mt-4 space-y-3">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
          return (
            <div key={goal.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: 'var(--color-ink)' }}>{goal.label}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>{goal.current}/{goal.target}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: progress >= 100 ? 'var(--color-bloom)' : 'var(--color-ember)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user: authUser } = useAuth();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase || !authUser) return;

        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (!userData) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('proof_cards')
          .select('*')
          .eq('user_id', userData.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        if (data) setProofs(data.map(mapDbProofToProof));
      } catch (e) {
        console.warn('Failed to fetch analytics:', e);
        setError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [authUser]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-premium animate-pulse p-5">
              <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="mt-2 h-8 w-16 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="card-premium animate-pulse p-5" style={{ height: 300 }}>
              <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="mt-4 h-48 w-full rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalViews = proofs.reduce((sum, p) => sum + p.viewCount, 0);
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const publicCount = proofs.filter((p) => p.visibility === 'public').length;
  const verificationRate = proofs.length > 0 ? Math.round((verifiedCount / proofs.length) * 100) : 0;

  if (proofs.length === 0 && !loading) {
    return (
      <div className="space-y-8">
        <header className="animate-fadeInUp">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Analytics</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Insights and metrics across your proof portfolio.
          </p>
        </header>
        <div className="card-premium flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
            <BarChart3 className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>No analytics yet</h3>
          <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Add your first proof card or connect a source to start seeing analytics and insights about your career portfolio.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/proof/new" className="btn-success px-5 py-2.5 text-sm inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create your first proof
            </Link>
            <Link href="/dashboard/sources/new" className="btn-outline px-5 py-2.5 text-sm inline-flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Add a source
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 w-full max-w-xl opacity-30 pointer-events-none">
            <div className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border)', height: 200 }}>
              <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="mt-4 mx-auto h-32 w-32 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
            <div className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border)', height: 200 }}>
              <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="mt-4 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 rounded" style={{ backgroundColor: 'var(--color-border)', width: `${100 - i * 15}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between animate-fadeInUp">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Analytics</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Insights and metrics across your proof portfolio.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/sources/new" className="btn-outline px-4 py-2 text-sm inline-flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Add Source
          </Link>
          <Link href="/dashboard/proof/new" className="btn-success px-4 py-2 text-sm inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Proof
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <StatCard label="Total Proofs" value={proofs.length} icon={BarChart3} color="var(--color-bloom)" />
        <StatCard
          label="Profile Views"
          value={formatNumber(totalViews)}
          sub={`Across ${proofs.length} proofs`}
          icon={Eye}
          color="var(--color-ember)"
          trend={totalViews > 0 ? 24 : undefined}
        />
        <StatCard
          label="Verified"
          value={`${verifiedCount}/${proofs.length}`}
          sub={`${verificationRate}% verified rate`}
          icon={Shield}
          color="var(--color-pulse)"
          trend={verificationRate > 50 ? 12 : undefined}
        />
        <StatCard
          label="Skills"
          value={new Set(proofs.flatMap(p => [...p.skillsExtracted, ...p.skillsUserAdded])).size}
          sub="Unique skills"
          icon={Target}
          color="var(--color-spark)"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <CareerProgressChart proofs={proofs} />
        <EngagementChart proofs={proofs} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
        <StreakCard proofs={proofs} />
        <GoalsProgressCard proofs={proofs} />
        <SourceBreakdown proofs={proofs} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        <SkillChart proofs={proofs} />
        <VerificationPie proofs={proofs} />
      </div>
    </div>
  );
}
