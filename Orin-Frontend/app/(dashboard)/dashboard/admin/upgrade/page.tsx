'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Crown, Users, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  subscription_plan: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  created_at: string;
}

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free', color: 'var(--color-text-tertiary)', description: 'Basic features, 5 proof cards' },
  { value: 'pro', label: 'Pro', color: 'var(--color-bloom)', description: 'Unlimited proofs, AI coach, analytics' },
  { value: 'team', label: 'Team', color: 'var(--color-ember)', description: 'Team features, priority support' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'trialing', label: 'Trialing' },
] as const;

const inputClass = "w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20";

export default function AdminUpgradePage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newPlan, setNewPlan] = useState<string>('pro');
  const [newStatus, setNewStatus] = useState<string>('active');
  const [upgrading, setUpgrading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [authError, setAuthError] = useState(false);

  const fetchUsers = useCallback(async (searchTerm?: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const res = await fetch(`/api/admin-dev/users/upgrade?${params}`);
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers(search || undefined);
  };

  const handleUpgrade = async () => {
    if (!selectedUser) return;
    setUpgrading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin-dev/users/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: selectedUser.id,
          plan: newPlan,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Failed to upgrade user' });
        return;
      }

      setResult({
        success: true,
        message: `Upgraded ${data.user.fullName || data.user.email} from ${data.user.previousPlan} to ${data.user.newPlan}`,
      });

      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, subscription_plan: newPlan, subscription_status: newStatus }
          : u
      ));

      setSelectedUser(prev => prev ? { ...prev, subscription_plan: newPlan, subscription_status: newStatus } : null);
    } catch (e) {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setUpgrading(false);
    }
  };

  if (authError) {
    return (
      <div className="space-y-8">
        <header className="animate-fadeInUp">
          <h1 className="text-2xl font-semibold flex items-center gap-3" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
            <Shield className="h-6 w-6" style={{ color: 'var(--color-pulse)' }} />
            Admin - Upgrade Users
          </h1>
        </header>
        <div className="card-premium p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10" style={{ color: 'var(--color-pulse)' }} />
          <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Admin authentication required</h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            You need to log in through the admin panel first.
          </p>
          <a href="/admin-dev" className="btn-success mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm">
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="animate-fadeInUp">
        <h1 className="text-2xl font-semibold flex items-center gap-3" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
          <Shield className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
          Admin - Upgrade Users
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Search for users and upgrade their subscription plan directly.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* User List */}
        <section className="lg:col-span-7 space-y-4">
          <div className="card-premium p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by email, username, or name..."
                  className={`${inputClass} pl-10`}
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </div>
              <button onClick={handleSearch} className="btn-success px-4 py-2.5 text-sm" disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </button>
            </div>
          </div>

          <div className="card-premium divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: 'var(--color-bloom)' }} />
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-8 w-8 mx-auto" style={{ color: 'var(--color-text-tertiary)' }} />
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No users found</p>
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    setNewPlan(user.subscription_plan === 'free' ? 'pro' : user.subscription_plan);
                    setNewStatus(user.subscription_status);
                  }}
                  className="w-full p-4 text-left transition-colors hover:bg-[var(--color-surface-dim)]"
                  style={{
                    backgroundColor: selectedUser?.id === user.id ? 'var(--color-bloom)06' : undefined,
                    borderLeft: selectedUser?.id === user.id ? '3px solid var(--color-bloom)' : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                        {user.full_name || user.username}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: user.subscription_plan === 'pro' ? 'var(--color-bloom)12' : user.subscription_plan === 'team' ? 'var(--color-ember)12' : 'var(--color-surface-dim)',
                          color: user.subscription_plan === 'pro' ? 'var(--color-bloom)' : user.subscription_plan === 'team' ? 'var(--color-ember)' : 'var(--color-text-tertiary)',
                        }}
                      >
                        {user.subscription_plan === 'pro' && <Crown className="h-2.5 w-2.5" />}
                        {user.subscription_plan}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                        backgroundColor: user.subscription_status === 'active' ? 'var(--color-bloom)12' : 'var(--color-surface-dim)',
                        color: user.subscription_status === 'active' ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                      }}>
                        {user.subscription_status}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Upgrade Panel */}
        <section className="lg:col-span-5">
          <div className="card-premium p-6 sticky top-24">
            {!selectedUser ? (
              <div className="text-center py-8">
                <ArrowRight className="h-8 w-8 mx-auto" style={{ color: 'var(--color-text-tertiary)' }} />
                <p className="mt-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Select a user from the list to upgrade their plan
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Upgrade User</h3>
                  <div className="mt-2 rounded-xl p-3" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      {selectedUser.full_name || selectedUser.username}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{selectedUser.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{
                        backgroundColor: 'var(--color-surface-dim)',
                        color: 'var(--color-text-tertiary)',
                      }}>
                        Current: {selectedUser.subscription_plan}
                      </span>
                      <ArrowRight className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{
                        backgroundColor: newPlan === 'pro' ? 'var(--color-bloom)12' : newPlan === 'team' ? 'var(--color-ember)12' : 'var(--color-surface-dim)',
                        color: newPlan === 'pro' ? 'var(--color-bloom)' : newPlan === 'team' ? 'var(--color-ember)' : 'var(--color-text-tertiary)',
                      }}>
                        New: {newPlan}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>New Plan</label>
                  <div className="space-y-2">
                    {PLAN_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewPlan(opt.value)}
                        className="w-full rounded-xl border p-3 text-left transition-all"
                        style={{
                          borderColor: newPlan === opt.value ? opt.color : 'var(--color-border)',
                          backgroundColor: newPlan === opt.value ? `${opt.color}08` : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: opt.color }}>{opt.label}</span>
                          {opt.value === 'pro' && <Crown className="h-3.5 w-3.5" style={{ color: opt.color }} />}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewStatus(opt.value)}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
                        style={{
                          borderColor: newStatus === opt.value ? 'var(--color-bloom)' : 'var(--color-border)',
                          backgroundColor: newStatus === opt.value ? 'var(--color-bloom)12' : 'transparent',
                          color: newStatus === opt.value ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {result && (
                  <div className="rounded-xl p-3 text-sm" style={{
                    border: `1px solid ${result.success ? 'var(--color-bloom)' : 'var(--color-pulse)'}40`,
                    backgroundColor: `${result.success ? 'var(--color-bloom)' : 'var(--color-pulse)'}08`,
                    color: result.success ? 'var(--color-bloom)' : 'var(--color-pulse)',
                  }}>
                    {result.message}
                  </div>
                )}

                <button
                  onClick={handleUpgrade}
                  disabled={upgrading || (newPlan === selectedUser.subscription_plan && newStatus === selectedUser.subscription_status)}
                  className="btn-success w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {upgrading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Upgrading...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4" /> Apply Changes
                    </span>
                  )}
                </button>

                <p className="text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  Changes take effect immediately. User will see pro features on next page load.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
