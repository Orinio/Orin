'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mapDbProofToProof, formatNumber, getProofTypeColor } from '@/lib/utils';
import type { Proof } from '@/lib/types';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: typeof BarChart3; color: string }) {
  return (
    <div className="card-premium group p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: `${color}12` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</p>}
    </div>
  );
}

function SourceBreakdown({ proofs }: { proofs: Proof[] }) {
  const counts: Record<string, number> = {};
  proofs.forEach((p) => {
    counts[p.sourceType] = (counts[p.sourceType] || 0) + 1;
  });

  const total = proofs.length;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Source Breakdown</h2>
      <div className="mt-4 space-y-3">
        {entries.map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: getProofTypeColor(type) }}
            />
            <span className="flex-1 text-sm capitalize" style={{ color: 'var(--color-ink)' }}>{type}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{count}</span>
            <span className="w-16 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {Math.round((count / total) * 100)}%
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No sources yet.</p>
        )}
      </div>
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

  const entries = Array.from(skillMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const maxCount = entries.length > 0 ? entries[0][1] : 1;

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Top Skills</h2>
      <div className="mt-4 space-y-2.5">
        {entries.map(([skill, count]) => (
          <div key={skill} className="flex items-center gap-3">
            <span className="w-28 truncate text-sm" style={{ color: 'var(--color-ink)' }}>{skill}</span>
            <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: 'var(--color-bloom)' }}
              />
            </div>
            <span className="w-8 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{count}</span>
          </div>
        ))}
      </div>
      {entries.length === 0 && (
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          No skills data available yet.
        </p>
      )}
    </div>
  );
}

function VerificationPie({ proofs }: { proofs: Proof[] }) {
  const counts: Record<string, number> = { verified: 0, pending: 0, draft: 0, rejected: 0 };
  proofs.forEach((p) => {
    counts[p.verificationStatus] = (counts[p.verificationStatus] || 0) + 1;
  });

  const total = proofs.length;
  const colors: Record<string, string> = {
    verified: 'var(--color-bloom)',
    pending: 'var(--color-ember)',
    draft: 'var(--color-mist)',
    rejected: 'var(--color-pulse)',
  };

  return (
    <div className="card-premium p-5">
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Verification Status</h2>
      <div className="mt-4 space-y-3">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[status] || 'var(--color-mist)' }} />
            <span className="flex-1 text-sm capitalize" style={{ color: 'var(--color-ink)' }}>{status}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{count}</span>
            <span className="w-16 text-right text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {total > 0 ? Math.round((count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('proof_cards')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        if (data) setProofs(data.map(mapDbProofToProof));
      } catch (e) {
        console.warn('Failed to fetch analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-premium animate-pulse p-5">
            <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="mt-2 h-8 w-16 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>
        ))}
      </div>
    );
  }

  const totalViews = proofs.reduce((sum, p) => sum + p.viewCount, 0);
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const publicCount = proofs.filter((p) => p.visibility === 'public').length;

  return (
    <div className="space-y-8">
      <header className="animate-fadeInUp">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Insights and metrics across your proof portfolio.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <StatCard label="Total Proofs" value={proofs.length} icon={BarChart3} color="var(--color-bloom)" />
        <StatCard
          label="Profile Views"
          value={formatNumber(totalViews)}
          sub={`Across ${proofs.length} proofs`}
          icon={Eye}
          color="var(--color-ember)"
        />
        <StatCard
          label="Verified"
          value={`${verifiedCount}/${proofs.length}`}
          sub={`${Math.round((verifiedCount / (proofs.length || 1)) * 100)}% verified rate`}
          icon={Shield}
          color="var(--color-pulse)"
        />
        <StatCard
          label="Public"
          value={`${publicCount}/${proofs.length}`}
          sub={`${Math.round((publicCount / (proofs.length || 1)) * 100)}% publicly visible`}
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
