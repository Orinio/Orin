'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Search, Loader2, X, ExternalLink, Trash2,
  ChevronLeft, ChevronRight, Plus,
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  company: string;
  type: string;
  location: string | null;
  is_remote: boolean;
  is_active: boolean;
  link: string;
  required_skills: string[];
  created_at: string;
}

export default function AdminOpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Opportunity | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', type: 'internship', description: '', location: '', is_remote: false, link: '', required_skills: '' });
  const limit = 15;

  const fetchItems = useCallback(async (p: number, q: string, t: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set('search', q);
      if (t) params.set('type', t);
      const res = await fetch(`/api/admin-dev/opportunities?${params}`);
      const d = await res.json();
      setItems(d.opportunities || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(page, search, typeFilter); }, [page, typeFilter, fetchItems]);

  const handleSearch = () => { setPage(1); fetchItems(1, search, typeFilter); };

  const toggleActive = async (opp: Opportunity) => {
    setBusy(true);
    try {
      await fetch('/api/admin-dev/opportunities', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: opp.id, is_active: !opp.is_active }),
      });
      fetchItems(page, search, typeFilter);
    } catch {} finally { setBusy(false); }
  };

  const deleteOpp = async (id: string) => {
    if (!confirm('Delete this opportunity?')) return;
    setBusy(true);
    try {
      await fetch(`/api/admin-dev/opportunities?id=${id}`, { method: 'DELETE' });
      setSel(null); fetchItems(page, search, typeFilter);
    } catch {} finally { setBusy(false); }
  };

  const createOpp = async () => {
    setBusy(true);
    try {
      await fetch('/api/admin-dev/opportunities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      setShowCreate(false);
      setForm({ title: '', company: '', type: 'internship', description: '', location: '', is_remote: false, link: '', required_skills: '' });
      fetchItems(page, search, typeFilter);
    } catch {} finally { setBusy(false); }
  };

  const pages = Math.ceil(total / limit);
  const types = ['', 'internship', 'job', 'scholarship', 'mentorship', 'hackathon', 'research', 'other'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
            <Briefcase className="w-6 h-6" style={{ color: 'var(--color-ember)' }} />
            Opportunity Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{total} total opportunities</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-success px-4 py-2 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Opportunity
        </button>
      </div>

      <div className="card-base p-4 flex gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by title or company..."
            className="w-full rounded-xl border bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
            style={{ borderColor: 'var(--color-border)' }} />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl border bg-[var(--color-surface)] px-3 py-2.5 text-sm focus:outline-none"
          style={{ borderColor: 'var(--color-border)' }}>
          <option value="">All Types</option>
          {types.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg mx-4 card-base p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Add Opportunity</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)]"><X className="w-4 h-4" /></button>
            </div>
            {(['title', 'company', 'link', 'location'] as const).map(f => (
              <input key={f} type="text" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                placeholder={f.replace(/_/g, ' ')}
                className="w-full rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                style={{ borderColor: 'var(--color-border)' }} />
            ))}
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="w-full rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none"
              style={{ borderColor: 'var(--color-border)' }}>
              {types.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" value={form.required_skills} onChange={e => setForm(p => ({ ...p, required_skills: e.target.value }))}
              placeholder="Required skills (comma separated)"
              className="w-full rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
              style={{ borderColor: 'var(--color-border)' }} />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_remote} onChange={e => setForm(p => ({ ...p, is_remote: e.target.checked }))} id="remote" />
              <label htmlFor="remote" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Remote</label>
            </div>
            <button onClick={createOpp} disabled={busy || !form.title || !form.company}
              className="btn-success w-full py-2.5 text-sm">
              {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card-base overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Opportunity</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Type</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Location</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>No opportunities found</td></tr>
            ) : items.map(o => (
              <tr key={o.id} className="hover:bg-[var(--color-surface-dim)] transition-colors"
                style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td className="px-4 py-3">
                  <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{o.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{o.company}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: 'rgba(246,146,38,0.1)', color: 'var(--color-ember)' }}>{o.type}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {o.location || '—'}{o.is_remote && ' · Remote'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(o)} disabled={busy}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                    style={{
                      backgroundColor: o.is_active ? 'rgba(11,171,119,0.1)' : 'rgba(100,116,139,0.1)',
                      color: o.is_active ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
                    }}>
                    {o.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right flex gap-1 justify-end">
                  <a href={o.link} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)]"><ExternalLink className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} /></a>
                  <button onClick={() => deleteOpp(o.id)} disabled={busy}
                    className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" style={{ color: 'var(--color-pulse)' }} /></button>
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
    </div>
  );
}
