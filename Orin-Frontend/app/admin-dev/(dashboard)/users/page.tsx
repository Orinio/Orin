'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/admin-dev/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: string, action: string, value?: string) => {
    setActionLoading(userId);
    try {
      await fetch('/api/admin-dev/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    setActionLoading(userId);
    try {
      await fetch(`/api/admin-dev/users?userId=${userId}`, { method: 'DELETE' });
      fetchUsers();
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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>User Management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {total.toLocaleString()} total users
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by email, username, or name..."
          className="flex-1 px-4 py-2.5 rounded-[var(--radius-md)] text-sm border outline-none"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
        />
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>User</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Role</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Provider</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-ink)' }}>Joined</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{user.username || '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleAction(user.id, 'setRole', e.target.value)}
                        disabled={actionLoading === user.id}
                        className="text-xs font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer"
                        style={{
                          backgroundColor: user.role === 'admin' ? 'rgba(238,66,102,0.1)' : 'rgba(11,171,119,0.1)',
                          color: user.role === 'admin' ? 'var(--color-pulse)' : 'var(--color-bloom)',
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: user.account_status === 'active' ? 'rgba(11,171,119,0.1)' : user.account_status === 'suspended' ? 'rgba(238,66,102,0.1)' : 'rgba(100,116,139,0.1)',
                          color: user.account_status === 'active' ? 'var(--color-bloom)' : user.account_status === 'suspended' ? 'var(--color-pulse)' : 'var(--color-text-tertiary)',
                        }}
                      >
                        {user.account_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {user.auth_provider}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.account_status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleAction(user.id, 'suspend')}
                            disabled={actionLoading === user.id}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                            style={{ color: 'var(--color-pulse)' }}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAction(user.id, 'activate')}
                            disabled={actionLoading === user.id}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                            style={{ color: 'var(--color-bloom)' }}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id)}
                          disabled={actionLoading === user.id}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
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

      {/* Pagination */}
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
