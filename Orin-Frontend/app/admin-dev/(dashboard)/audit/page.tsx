'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin-dev/audit?page=${page}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Audit Log</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {total.toLocaleString()} total entries — all admin actions are logged.
        </p>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Time</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Action</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Entity</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Entity ID</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    No audit entries yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: 'rgba(238,66,102,0.1)', color: 'var(--color-pulse)' }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {log.entity_type || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono truncate max-w-[120px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      {log.entity_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {log.new_data ? JSON.stringify(log.new_data).slice(0, 60) : '—'}
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
