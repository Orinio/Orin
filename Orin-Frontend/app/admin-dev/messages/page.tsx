'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Loader2, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Eye,
} from 'lucide-react';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  user_id: string | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  new: { icon: <AlertCircle className="w-3 h-3" />, color: 'var(--color-pulse)', bg: 'rgba(238,66,102,0.1)' },
  in_progress: { icon: <Clock className="w-3 h-3" />, color: 'var(--color-ember)', bg: 'rgba(246,146,38,0.1)' },
  resolved: { icon: <CheckCircle className="w-3 h-3" />, color: 'var(--color-bloom)', bg: 'rgba(11,171,119,0.1)' },
  spam: { icon: <AlertCircle className="w-3 h-3" />, color: 'var(--color-text-secondary)', bg: 'rgba(100,116,139,0.1)' },
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const limit = 15;

  const fetchMessages = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (s) params.set('status', s);
      const res = await fetch(`/api/admin-dev/messages?${params}`);
      const d = await res.json();
      setMessages(d.messages || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMessages(page, statusFilter); }, [page, statusFilter, fetchMessages]);

  const updateStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      await fetch('/api/admin-dev/messages', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      setSel(null); fetchMessages(page, statusFilter);
    } catch {} finally { setBusy(false); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Mail className="w-6 h-6" style={{ color: 'var(--color-pulse)' }} />
          Contact Messages
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{total} total messages</p>
      </div>

      <div className="card-base p-4 flex gap-2 flex-wrap">
        {['', 'new', 'in_progress', 'resolved', 'spam'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border flex items-center gap-1.5"
            style={{
              borderColor: statusFilter === s ? 'var(--color-bloom)' : 'var(--color-border)',
              backgroundColor: statusFilter === s ? 'rgba(11,171,119,0.1)' : 'transparent',
              color: statusFilter === s ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
            }}>
            {s && statusConfig[s]?.icon}
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="card-base overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>From</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Subject</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                  <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} /></td></tr>
                ) : messages.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>No messages</td></tr>
                ) : messages.map(m => {
                  const sc = statusConfig[m.status] || statusConfig.new;
                  return (
                    <tr key={m.id} onClick={() => setSel(m)}
                      className="cursor-pointer hover:bg-[var(--color-surface-dim)] transition-colors"
                      style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{m.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{m.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm truncate max-w-[200px]" style={{ color: 'var(--color-ink)' }}>
                        {m.subject || 'No subject'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize flex items-center gap-1 w-fit"
                          style={{ backgroundColor: sc.bg, color: sc.color }}>
                          {sc.icon} {m.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(m.created_at).toLocaleDateString()}
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
                <Mail className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Select a message to view</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--color-ink)' }}>{sel.subject || 'No subject'}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      From {sel.name} ({sel.email}) · {new Date(sel.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
                  {sel.message}
                </div>

                <div className="flex gap-2" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                  {['in_progress', 'resolved', 'spam'].map(s => (
                    <button key={s} disabled={busy || sel.status === s}
                      onClick={() => updateStatus(sel.id, s)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border disabled:opacity-40"
                      style={{
                        borderColor: sel.status === s ? 'var(--color-bloom)' : 'var(--color-border)',
                        backgroundColor: sel.status === s ? 'rgba(11,171,119,0.1)' : 'transparent',
                        color: sel.status === s ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
                      }}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
