'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mapDbProofSourceToProofSource, formatRelativeTime } from '@/lib/utils';
import type { ProofSource, ProofSourceType } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

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
        <div key={i} className="card-premium animate-pulse p-5">
          <div className="h-4 w-16 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="mt-3 h-5 w-40 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="mt-2 h-3 w-32 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-premium flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
        <Plus className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
        No sources connected
      </h3>
      <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Connect your GitHub, Kaggle, or other accounts to automatically import proof of work.
      </p>
      <div className="mt-6">
        <Link href="/dashboard/sources/new" className="btn-success px-5 py-2.5 text-sm inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add a source
        </Link>
      </div>
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<ProofSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchSources() {
      try {
        if (!supabase || !user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!userData) return;

        const { data, error } = await supabase
          .from('proof_sources')
          .select('*')
          .eq('user_id', userData.id)
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
  }, [user]);

  if (loading) return <SourceSkeleton />;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between animate-fadeInUp">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Sources</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Connected accounts and external data sources.
          </p>
        </div>
        <Link href="/dashboard/sources/new" className="btn-success px-4 py-2.5 text-sm">
          <Plus className="h-4 w-4" />
          Add source
        </Link>
      </header>

      {sources.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          {sources.map((source) => (
            <div
              key={source.id}
              className="card-premium group p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
                  {SOURCE_ICONS[source.sourceType] || 'OT'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {source.sourceName || SOURCE_LABELS[source.sourceType]}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {SOURCE_LABELS[source.sourceType]}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: source.isConnected ? 'var(--color-bloom)12' : 'var(--color-surface-dim)',
                    color: source.isConnected ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                  }}
                >
                  {source.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {source.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 truncate text-xs font-medium transition-colors hover:underline"
                  style={{ color: 'var(--color-bloom)' }}
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {source.sourceUrl}
                </a>
              )}

              {source.lastSyncedAt && (
                <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <RefreshCw className="h-3 w-3" />
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
