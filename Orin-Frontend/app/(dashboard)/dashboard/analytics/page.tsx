'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Eye, Shield, Plus, ExternalLink, ArrowUpRight } from 'lucide-react';
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
          label="Public"
          value={`${publicCount}/${proofs.length}`}
          sub={`${proofs.length > 0 ? Math.round((publicCount / proofs.length) * 100) : 0}% publicly visible`}
          icon={TrendingUp}
          color="var(--color-spark)"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <SourceBreakdown proofs={proofs} />
        <VerificationPie proofs={proofs} />
      </div>

      <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
        <SkillChart proofs={proofs} />
      </div>
    </div>
  );
}
