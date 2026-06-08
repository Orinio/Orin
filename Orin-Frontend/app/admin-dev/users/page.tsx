'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Users, Shield, Crown, Ban, CheckCircle, Trash2, Eye,
  ChevronLeft, ChevronRight, Loader2, X, Send, UserCog,
  MapPin, Calendar,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  account_status: string;
  created_at: string;
  last_login_at: string | null;
  auth_provider: string;
}

interface UserDetail {
  user: AdminUser & {
    bio: string | null; headline: string | null; location: string | null;
    college: string | null; year: string | null; avatar_url: string | null;
    website_url: string | null; github_url: string | null;
    linkedin_url: string | null; twitter_url: string | null;
    is_profile_public: boolean; onboarded: boolean;
  };
  subscription: { plan: string; status: string };
  proofCount: number;
  sourceCount: number;
  recentNotifications: Array<{ id: string; type: string; title: string; read_at: string | null }>;
}

const inputClass = "w-full rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const limit = 15;

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set('search', q);
      const res = await fetch(`/api/admin-dev/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(page, search); }, [page, fetchUsers]);

  const handleSearch = () => { setPage(1); fetchUsers(1, search); };

  const openDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin-dev/users/${userId}`);
      const data = await res.json();
      setSelectedUser(data);
      setEditFields({
        full_name: data.user.full_name || '',
        username: data.user.username || '',
        email: data.user.email || '',
        bio: data.user.bio || '',
        headline: data.user.headline || '',
        location: data.user.location || '',
        college: data.user.college || '',
      });
    } catch {} finally { setDetailLoading(false); }
  };

  const updateUserField = async (action: string, value: string) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin-dev/users/${selectedUser.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [action]: value }),
      });
      await openDetail(selectedUser.user.id);
      fetchUsers(page, search);
    } catch {} finally { setActionLoading(false); }
  };

  const saveProfileEdits = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin-dev/users/${selectedUser.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields),
      });
      await openDetail(selectedUser.user.id);
      setEditMode(false);
      fetchUsers(page, search);
    } catch {} finally { setActionLoading(false); }
  };

  const deleteUser = async () => {
    if (!selectedUser || !confirm('Are you sure you want to deactivate this user?')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/admin-dev/users/${selectedUser.user.id}`, { method: 'DELETE' });
      setSelectedUser(null);
      fetchUsers(page, search);
    } catch {} finally { setActionLoading(false); }
  };

  const sendNotification = async () => {
    if (!selectedUser || !notifTitle.trim()) return;
    setSendingNotif(true);
    try {
      await fetch('/api/admin-dev/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.user.id,
          title: notifTitle,
          body: notifMessage || null,
          type: 'system',
        }),
      });
      setNotifTitle('');
      setNotifMessage('');
      await openDetail(selectedUser.user.id);
    } catch {} finally { setSendingNotif(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
            <Users className="w-6 h-6" style={{ color: 'var(--color-bloom)' }} />
            User Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {total} total users
          </p>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by email, username, or name..."
              className={`${inputClass} pl-10`} style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <button onClick={handleSearch} className="btn-success px-5 py-2.5 text-sm">Search</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>User</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Role</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Joined</th>
                    <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} /></td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>No users found</td></tr>
                  ) : users.map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer transition-colors hover:bg-[var(--color-surface-dim)]"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                      onClick={() => openDetail(u.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                            {(u.username || u.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{u.full_name || u.username}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                          backgroundColor: u.role === 'admin' ? 'rgba(238,66,102,0.1)' : 'rgba(11,171,119,0.1)',
                          color: u.role === 'admin' ? 'var(--color-pulse)' : 'var(--color-bloom)',
                        }}>
                          {u.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                          backgroundColor: u.account_status === 'active' ? 'rgba(11,171,119,0.1)' : u.account_status === 'suspended' ? 'rgba(238,66,102,0.1)' : 'rgba(100,116,139,0.1)',
                          color: u.account_status === 'active' ? 'var(--color-bloom)' : u.account_status === 'suspended' ? 'var(--color-pulse)' : 'var(--color-text-secondary)',
                        }}>
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); openDetail(u.id); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] transition-colors">
                          <Eye className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-5">
          <div className="card-base p-6 sticky top-24">
            {detailLoading ? (
              <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} /></div>
            ) : !selectedUser ? (
              <div className="py-12 text-center">
                <UserCog className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Select a user to view details</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                      {selectedUser.user.full_name || selectedUser.user.username}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{selectedUser.user.email}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setEditMode(false); }}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Plan', value: selectedUser.subscription.plan, color: selectedUser.subscription.plan === 'pro' ? 'var(--color-bloom)' : 'var(--color-text-secondary)' },
                    { label: 'Proofs', value: selectedUser.proofCount, color: 'var(--color-ember)' },
                    { label: 'Sources', value: selectedUser.sourceCount, color: 'var(--color-pulse)' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Role & Status */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Role</label>
                    <div className="flex gap-2">
                      {['user', 'moderator', 'admin'].map(r => (
                        <button key={r} disabled={actionLoading}
                          onClick={() => updateUserField('role', r)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border"
                          style={{
                            borderColor: selectedUser.user.role === r ? (r === 'admin' ? 'var(--color-pulse)' : 'var(--color-bloom)') : 'var(--color-border)',
                            backgroundColor: selectedUser.user.role === r ? (r === 'admin' ? 'rgba(238,66,102,0.1)' : 'rgba(11,171,119,0.1)') : 'transparent',
                            color: selectedUser.user.role === r ? (r === 'admin' ? 'var(--color-pulse)' : 'var(--color-bloom)') : 'var(--color-text-secondary)',
                          }}
                        >
                          {r === 'admin' && <Shield className="w-3 h-3 inline mr-1" />}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Account Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {['active', 'suspended', 'deactivated'].map(s => (
                        <button key={s} disabled={actionLoading}
                          onClick={() => updateUserField('account_status', s)}
                          className="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border"
                          style={{
                            borderColor: selectedUser.user.account_status === s ? 'var(--color-bloom)' : 'var(--color-border)',
                            backgroundColor: selectedUser.user.account_status === s ? 'rgba(11,171,119,0.1)' : 'transparent',
                            color: selectedUser.user.account_status === s ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {s === 'active' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {s === 'suspended' && <Ban className="w-3 h-3 inline mr-1" />}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Subscription Plan</label>
                    <div className="flex gap-2">
                      {['free', 'pro', 'team'].map(p => (
                        <button key={p} disabled={actionLoading}
                          onClick={() => {
                            fetch('/api/admin-dev/users/upgrade', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ targetUserId: selectedUser.user.id, plan: p }),
                            }).then(() => openDetail(selectedUser.user.id));
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border"
                          style={{
                            borderColor: selectedUser.subscription.plan === p ? (p === 'pro' ? 'var(--color-bloom)' : p === 'team' ? 'var(--color-ember)' : 'var(--color-border)') : 'var(--color-border)',
                            backgroundColor: selectedUser.subscription.plan === p ? (p === 'pro' ? 'rgba(11,171,119,0.1)' : p === 'team' ? 'rgba(246,146,38,0.1)' : 'rgba(100,116,139,0.1)') : 'transparent',
                            color: selectedUser.subscription.plan === p ? (p === 'pro' ? 'var(--color-bloom)' : p === 'team' ? 'var(--color-ember)' : 'var(--color-text-secondary)') : 'var(--color-text-secondary)',
                          }}
                        >
                          {p === 'pro' && <Crown className="w-3 h-3 inline mr-1" />}
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Edit Profile */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Profile</label>
                    <button onClick={() => setEditMode(!editMode)} className="text-[10px] font-bold" style={{ color: 'var(--color-bloom)' }}>
                      {editMode ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  {editMode ? (
                    <div className="space-y-2">
                      {['full_name', 'username', 'email', 'headline', 'bio', 'location', 'college'].map(field => (
                        <input key={field} type="text" value={editFields[field] || ''}
                          onChange={(e) => setEditFields(prev => ({ ...prev, [field]: e.target.value }))}
                          placeholder={field.replace(/_/g, ' ')}
                          className={inputClass} style={{ borderColor: 'var(--color-border)' }}
                        />
                      ))}
                      <button onClick={saveProfileEdits} disabled={actionLoading}
                        className="btn-success w-full py-2 text-xs">
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {selectedUser.user.headline && <p><span className="font-semibold">Headline:</span> {selectedUser.user.headline}</p>}
                      {selectedUser.user.location && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selectedUser.user.location}</p>}
                      {selectedUser.user.college && <p><span className="font-semibold">College:</span> {selectedUser.user.college}</p>}
                      {selectedUser.user.bio && <p className="line-clamp-2">{selectedUser.user.bio}</p>}
                      <p className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {new Date(selectedUser.user.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Send Notification */}
                <div style={{ borderTop: '1px solid var(--color-border)' }} className="pt-4">
                  <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Send Notification</label>
                  <input type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Notification title" className={`${inputClass} mb-2`} style={{ borderColor: 'var(--color-border)' }} />
                  <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Message body (optional)" rows={2}
                    className={`${inputClass} resize-none mb-2`} style={{ borderColor: 'var(--color-border)' }} />
                  <button onClick={sendNotification} disabled={sendingNotif || !notifTitle.trim()}
                    className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: 'var(--color-ink)', color: '#fff' }}>
                    {sendingNotif ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Send
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <button onClick={deleteUser} disabled={actionLoading}
                    className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all hover:bg-red-50"
                    style={{ borderColor: 'var(--color-pulse)', color: 'var(--color-pulse)' }}>
                    <Trash2 className="w-3 h-3" /> Deactivate User
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
