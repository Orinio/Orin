'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, CheckCircle, XCircle, Trash2, Eye,
  ChevronLeft, ChevronRight, Loader2, X, ExternalLink, Filter,
} from 'lucide-react';

interface Proof {
  id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_url: string | null;
  verification_status: string;
  visibility: string;
  skills_extracted: string[];
  view_count: number;
  created_at: string;
  verified_at: string | null;
  users: { id: string; email: string; username: string } | null;
}

const sc: Record<string, { bg: string; c: string }> = {
  verified: { bg: 'rgba(11,171,119,0.1)', c: 'var(--color-bloom)' },
  pending: { bg: 'rgba(246,146,38,0.1)', c: 'var(--color-ember)' },
  rejected: { bg: 'rgba(238,66,102,0.1)', c: 'var(--color-pulse)' },
  draft: { bg: 'rgba(100,116,139,0.1)', c: 'var(--color-text-secondary)' },
};

export default function AdminProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Proof | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = 15;

  const fetchProofs = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (s) params.set('status', s);
      const res = await fetch(`/api/admin-dev/proofs?${params}`);
      const d = await res.json();
      setProofs(d.proofs || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProofs(page, filter); }, [page, filter, fetchProofs]);

  const act = async (proofId: string, action: string) => {
    setBusy(true);
    try {
      await fetch('/api/admin-dev/proofs', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId, action }),
      });
      setSel(null); fetchProofs(page, filter);
    } catch {} finally { setBusy(false); }
  };

  const del = async (proofId: string) => {
    if (!confirm('Delete this proof?')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin-dev/proofs?proofId=${proofId}`, { method: 'DELETE' });
      setSel(null); fetchProofs(page, filter);
    } catch {} finally { setBusy(false); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <ShieldCheck className="w-6 h-6" style={{ color: 'var(--color-bloom)' }} />
          Proof Management
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{total} total proofs</p>
      </div>

      <div className="card-base p-4 flex gap-2 flex-wrap items-center">
        <Filter className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        {['', 'pending', 'verified', 'rejected', 'draft'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border"
            style={{
              borderColor: filter === s ? 'var(--color-bloom)' : 'var(--color-border)',
              backgroundColor: filter === s ? 'rgba(11,171,119,0.1)' : 'transparent',
              color: filter === s ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
            }}>{s || 'All'}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="card-base overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Proof</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Owner</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                  <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} /></td></tr>
                ) : proofs.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>No proofs found</td></tr>
                ) : proofs.map(p => {
                  const c = sc[p.verification_status] || sc.draft;
                  return (
                    <tr key={p.id} onClick={() => setSel(p)}
                      className="cursor-pointer hover:bg-[var(--color-surface-dim)] transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: c.bg, color: c.c }}>
                            {p.source_type.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{p.title}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{p.source_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {p.users?.username || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: c.bg, color: c.c }}>{p.verification_status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setSel(p); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)]">
                          <Eye className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="card-base p-6 sticky top-24">
            {!sel ? (
              <div className="py-12 text-center">
                <ShieldCheck className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Select a proof to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>{sel.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      by {sel.users?.username || 'unknown'} · {new Date(sel.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setSel(null)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)]"><X className="w-4 h-4" /></button>
                </div>

                {sel.description && (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{sel.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {sel.skills_extracted.map(s => (
                    <span key={s} className="badge-ink text-[10px] px-2 py-0.5">{s}</span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>{sel.view_count} views</span>
                  <span>·</span>
                  <span className="capitalize">{sel.visibility}</span>
                  {sel.source_url && (
                    <>
                      <span>·</span>
                      <a href={sel.source_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline" style={{ color: 'var(--color-bloom)' }}>
                        <ExternalLink className="w-3 h-3" /> Source
                      </a>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button disabled={busy} onClick={() => act(sel.id, 'verify')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
                    <CheckCircle className="w-3.5 h-3.5" /> Verify
                  </button>
                  <button disabled={busy} onClick={() => act(sel.id, 'reject')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    style={{ backgroundColor: 'rgba(238,66,102,0.1)', color: 'var(--color-pulse)' }}>
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button disabled={busy} onClick={() => del(sel.id)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border hover:bg-red-50"
                    style={{ borderColor: 'var(--color-pulse)', color: 'var(--color-pulse)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
