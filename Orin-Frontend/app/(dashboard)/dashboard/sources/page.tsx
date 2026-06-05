'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { mapDbProofSourceToProofSource, formatRelativeTime } from '@/lib/utils';
import type { ProofSource, ProofSourceType } from '@/lib/types';

const SOURCE_ICONS: Record<ProofSourceType, string> = {
  github: 'GH',
  kaggle: 'KG',
  certificate: 'CR',
  hackathon: 'HK',
  project: 'PJ',
  blog: 'BL',
  demo: 'DM',
  other: 'OT',
};

const SOURCE_LABELS: Record<ProofSourceType, string> = {
  github: 'GitHub',
  kaggle: 'Kaggle',
  certificate: 'Certificate',
  hackathon: 'Hackathon',
  project: 'Project',
  blog: 'Blog',
  demo: 'Demo',
  other: 'Other',
};

function SourceSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
          <div className="h-4 w-16 rounded bg-[var(--color-neutral-border)]" />
          <div className="mt-3 h-5 w-40 rounded bg-[var(--color-neutral-border)]" />
          <div className="mt-2 h-3 w-32 rounded bg-[var(--color-neutral-border)]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
        <svg className="h-8 w-8 text-[var(--color-primary-emerald)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--color-neutral-text)]">
        No sources connected
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-neutral-text-secondary)]">
        Connect your GitHub, Kaggle, or other accounts to automatically import proof of work.
      </p>
      <Link
        href="/dashboard/sources/new"
        className="mt-4 rounded-lg bg-[var(--color-primary-emerald)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-emerald)]/90"
      >
        Add a source
      </Link>
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<ProofSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSources() {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('proof_sources')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        if (data) setSources(data.map(mapDbProofSourceToProofSource));
      } catch (e) {
        console.warn('Failed to fetch sources:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  if (loading) return <SourceSkeleton />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">Sources</h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
            Connected accounts and external data sources.
          </p>
        </div>
        <Link
          href="/dashboard/sources/new"
          className="rounded-lg bg-[var(--color-primary-emerald)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-emerald)]/90"
        >
          + Add source
        </Link>
      </header>

      {sources.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5 transition hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-surface-alt)] text-xs font-bold text-[var(--color-neutral-text)]">
                  {SOURCE_ICONS[source.sourceType] || 'OT'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-neutral-text)]">
                    {source.sourceName || SOURCE_LABELS[source.sourceType]}
                  </p>
                  <p className="text-xs text-[var(--color-neutral-text-secondary)]">
                    {SOURCE_LABELS[source.sourceType]}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    source.isConnected
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {source.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {source.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block truncate text-xs text-[var(--color-primary-emerald)] hover:underline"
                >
                  {source.sourceUrl}
                </a>
              )}

              {source.lastSyncedAt && (
                <p className="mt-2 text-xs text-[var(--color-neutral-text-tertiary)]">
                  Last synced {formatRelativeTime(source.lastSyncedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
