'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Eye } from 'lucide-react';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  description: string | null;
  created_at: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<AuditLog | null>(null);
  const limit = 30;

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-dev/audit?page=${p}&limit=${limit}`);
      const d = await res.json();
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(page); }, [page, fetchLogs]);

  const pages = Math.ceil(total / limit);

  const actionColors: Record<string, string> = {
    'admin.updateUser': 'var(--color-bloom)',
    'admin.deleteUser': 'var(--color-pulse)',
    'admin.verifyProof': 'var(--color-bloom)',
    'admin.rejectProof': 'var(--color-pulse)',
    'admin.deleteProof': 'var(--color-pulse)',
    'admin.updateOpportunity': 'var(--color-ember)',
    'admin.createOpportunity': 'var(--color-ember)',
    'admin.deleteOpportunity': 'var(--color-pulse)',
    'admin.updateMessage': 'var(--color-ember)',
    'admin.sendNotification': 'var(--color-spark)',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <ClipboardList className="w-6 h-6" style={{ color: 'var(--color-ember)' }} />
          Audit Log
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {total} total entries
        </p>
      </div>

      <div className="card-base overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Action</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Entity</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Actor</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Time</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>No audit entries</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} className="hover:bg-[var(--color-surface-dim)] transition-colors"
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${actionColors[l.action] || 'var(--color-text-secondary)'}15`, color: actionColors[l.action] || 'var(--color-text-secondary)' }}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{l.entity_type}</span>
                  {l.entity_id && <span className="text-[10px] ml-1" style={{ color: 'var(--color-text-secondary)' }}>{l.entity_id.slice(0, 8)}...</span>}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {l.actor_role || 'system'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(l.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSel(sel?.id === l.id ? null : l)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)]">
                    <Eye className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </td>
              </tr>
            ))}
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

      {/* Detail */}
      {sel && (
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--color-ink)' }}>Audit Entry Details</h3>
            <button onClick={() => setSel(null)} className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Close</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Action</p>
              <p style={{ color: 'var(--color-ink)' }}>{sel.action}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Entity</p>
              <p style={{ color: 'var(--color-ink)' }}>{sel.entity_type} ({sel.entity_id})</p>
            </div>
            {sel.old_data && (
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Old Data</p>
                <pre className="text-[11px] p-2 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
                  {JSON.stringify(sel.old_data, null, 2)}
                </pre>
              </div>
            )}
            {sel.new_data && (
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>New Data</p>
                <pre className="text-[11px] p-2 rounded-lg overflow-x-auto" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
                  {JSON.stringify(sel.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
