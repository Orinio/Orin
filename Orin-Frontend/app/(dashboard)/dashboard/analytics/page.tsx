'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { mapDbProofToProof, formatNumber, getProofTypeColor } from '@/lib/utils';
import type { Proof } from '@/lib/types';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
      <p className="text-sm text-[var(--color-neutral-text-secondary)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-[var(--color-neutral-text)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--color-neutral-text-tertiary)]">{sub}</p>}
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
    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
      <h2 className="text-lg font-semibold font-serif">Source Breakdown</h2>
      <div className="mt-4 space-y-3">
        {entries.map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: getProofTypeColor(type) }}
            />
            <span className="flex-1 text-sm capitalize text-[var(--color-neutral-text)]">{type}</span>
            <span className="text-sm font-medium text-[var(--color-neutral-text)]">{count}</span>
            <span className="w-16 text-right text-xs text-[var(--color-neutral-text-tertiary)]">
              {Math.round((count / total) * 100)}%
            </span>
          </div>
        ))}
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
    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
      <h2 className="text-lg font-semibold font-serif">Top Skills</h2>
      <div className="mt-4 space-y-2.5">
        {entries.map(([skill, count]) => (
          <div key={skill} className="flex items-center gap-3">
            <span className="w-28 truncate text-sm text-[var(--color-neutral-text)]">{skill}</span>
            <div className="flex-1 h-2 rounded-full bg-[var(--color-neutral-bg)]">
              <div
                className="h-2 rounded-full bg-[var(--color-primary-emerald)]"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-[var(--color-neutral-text-secondary)]">{count}</span>
          </div>
        ))}
      </div>
      {entries.length === 0 && (
        <p className="mt-4 text-sm text-[var(--color-neutral-text-tertiary)]">
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
    verified: 'bg-emerald-500',
    pending: 'bg-amber-500',
    draft: 'bg-slate-400',
    rejected: 'bg-red-500',
  };

  return (
    <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
      <h2 className="text-lg font-semibold font-serif">Verification Status</h2>
      <div className="mt-4 space-y-3">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="flex items-center gap-3">
            <span className={`h-3 w-3 shrink-0 rounded-full ${colors[status] || 'bg-slate-400'}`} />
            <span className="flex-1 text-sm capitalize text-[var(--color-neutral-text)]">{status}</span>
            <span className="text-sm font-medium text-[var(--color-neutral-text)]">{count}</span>
            <span className="w-16 text-right text-xs text-[var(--color-neutral-text-tertiary)]">
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
          <div key={i} className="animate-pulse rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <div className="h-3 w-20 rounded bg-[var(--color-neutral-border)]" />
            <div className="mt-2 h-8 w-16 rounded bg-[var(--color-neutral-border)]" />
          </div>
        ))}
      </div>
    );
  }

  const totalViews = proofs.reduce((sum, p) => sum + p.viewCount, 0);
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const publicCount = proofs.filter((p) => p.visibility === 'public').length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
          Insights and metrics across your proof portfolio.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Proofs" value={proofs.length} />
        <StatCard
          label="Profile Views"
          value={formatNumber(totalViews)}
          sub={`Across ${proofs.length} proofs`}
        />
        <StatCard
          label="Verified"
          value={`${verifiedCount}/${proofs.length}`}
          sub={`${Math.round((verifiedCount / (proofs.length || 1)) * 100)}% verified rate`}
        />
        <StatCard
          label="Public"
          value={`${publicCount}/${proofs.length}`}
          sub={`${Math.round((publicCount / (proofs.length || 1)) * 100)}% publicly visible`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SourceBreakdown proofs={proofs} />
        <VerificationPie proofs={proofs} />
      </div>

      <SkillChart proofs={proofs} />
    </div>
  );
}
