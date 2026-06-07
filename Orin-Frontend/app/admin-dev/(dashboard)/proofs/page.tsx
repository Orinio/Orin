'use client';

import { useState, useEffect, useCallback } from 'react';

interface Proof {
  id: string;
  title: string;
  verification_status: string;
  source_type: string;
  created_at: string;
  users: { id: string; email: string; username: string } | null;
}

export default function AdminProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProofs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);

    try {
      const res = await fetch(`/api/admin-dev/proofs?${params}`);
      const data = await res.json();
      setProofs(data.proofs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchProofs(); }, [fetchProofs]);

  const handleAction = async (proofId: string, action: string) => {
    setActionLoading(proofId);
    try {
      await fetch('/api/admin-dev/proofs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId, action }),
      });
      fetchProofs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (proofId: string) => {
    if (!confirm('Are you sure you want to delete this proof?')) return;
    setActionLoading(proofId);
    try {
      await fetch(`/api/admin-dev/proofs?proofId=${proofId}`, { method: 'DELETE' });
      fetchProofs();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Proof Management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {total.toLocaleString()} total proof cards
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {['', 'pending', 'verified', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatus(s); setPage(1); }}
            className="px-4 py-2 text-xs font-semibold rounded-full transition-all"
            style={{
              backgroundColor: status === s ? 'var(--color-ink)' : 'var(--color-surface)',
              color: status === s ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${status === s ? 'var(--color-ink)' : 'var(--color-border)'}`,
            }}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Proof</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Owner</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Source</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Created</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    Loading...
                  </td>
                </tr>
              ) : proofs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    No proofs found
                  </td>
                </tr>
              ) : (
                proofs.map((proof) => (
                  <tr key={proof.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--color-ink)' }}>{proof.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {proof.users?.username || proof.users?.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: proof.verification_status === 'verified' ? 'rgba(11,171,119,0.1)' : proof.verification_status === 'pending' ? 'rgba(246,146,38,0.1)' : 'rgba(238,66,102,0.1)',
                          color: proof.verification_status === 'verified' ? 'var(--color-bloom)' : proof.verification_status === 'pending' ? 'var(--color-ember)' : 'var(--color-pulse)',
                        }}
                      >
                        {proof.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {proof.source_type}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {new Date(proof.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {proof.verification_status !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => handleAction(proof.id, 'verify')}
                            disabled={actionLoading === proof.id}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md"
                            style={{ color: 'var(--color-bloom)' }}
                          >
                            Verify
                          </button>
                        )}
                        {proof.verification_status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleAction(proof.id, 'reject')}
                            disabled={actionLoading === proof.id}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md"
                            style={{ color: 'var(--color-pulse)' }}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(proof.id)}
                          disabled={actionLoading === proof.id}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border disabled:opacity-40"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border disabled:opacity-40"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
