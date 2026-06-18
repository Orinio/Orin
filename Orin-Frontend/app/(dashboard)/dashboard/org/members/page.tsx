'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/org-context';
import { supabase } from '@/lib/supabase';
import { Crown, Shield, User, Eye, Trash2, UserPlus, Mail, X } from 'lucide-react';
import type { OrgRole } from '@/lib/types';

const ROLE_ICONS: Record<OrgRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: 'text-yellow-500',
  admin: 'text-blue-500',
  member: 'text-green-500',
  viewer: 'text-gray-500',
};

interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  invited_by_user?: { username: string; full_name: string } | null;
}

export default function OrgMembersPage() {
  const { currentOrg, myRole, refreshCurrentOrg } = useOrg();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const canManage = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    if (!currentOrg || !canManage) return;
    fetchInvitations();
  }, [currentOrg, canManage]);

  const fetchInvitations = async () => {
    if (!currentOrg) return;
    setLoadingInvitations(true);
    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}/invitations`,
        { headers: { Authorization: `Bearer ${session?.session?.access_token}` } }
      );
      const data = await resp.json();
      if (resp.ok && data.success) {
        setInvitations(data.data.filter((i: OrgInvitation) => i.status === 'pending'));
      }
    } catch {
      // ignore
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setInviting(true);
    setError(null);

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}/invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error?.message || 'Failed to invite');
        return;
      }

      setInviteEmail('');
      setInviteRole('member');
      await refreshCurrentOrg();
      await fetchInvitations();
    } catch {
      setError('Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentOrg) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}/members/${userId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${session?.session?.access_token}` } }
      );

      if (resp.ok) {
        await refreshCurrentOrg();
      }
    } catch {
      // silently fail
    }
  };

  const handleRoleChange = async (userId: string, newRole: OrgRole) => {
    if (!currentOrg) return;

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}/members/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (resp.ok) {
        await refreshCurrentOrg();
      }
    } catch {
      // silently fail
    }
  };

  const handleRevokeInvitation = async (inviteId: string) => {
    if (!currentOrg) return;
    if (!confirm('Revoke this invitation?')) return;

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}/invitations/${inviteId}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${session?.session?.access_token}` } }
      );

      if (resp.ok) {
        await fetchInvitations();
      }
    } catch {
      // ignore
    }
  };

  if (!currentOrg) {
    return (
      <div className="py-20 text-center text-[var(--color-text-secondary)]">
        Select an organization to manage members.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{currentOrg.name} — Members</h1>
        <p className="text-[var(--color-text-secondary)]">
          {currentOrg.memberCount} member{currentOrg.memberCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Invite form */}
      {canManage && (
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as OrgRole)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-bloom)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Pending Invitations */}
      {canManage && invitations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            Pending Invitations
          </h2>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4 opacity-75"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{inv.email}</div>
                <div className="text-sm text-[var(--color-text-tertiary)]">
                  Invited as <span className="capitalize">{inv.role}</span>
                  {inv.invited_by_user && ` by ${inv.invited_by_user.full_name || inv.invited_by_user.username}`}
                </div>
              </div>
              <button
                onClick={() => handleRevokeInvitation(inv.id)}
                className="rounded-lg p-1 text-[var(--color-text-tertiary)] transition hover:bg-red-50 hover:text-red-600"
                title="Revoke invitation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
          Active Members
        </h2>
        {currentOrg.members.map((member) => {
          const RoleIcon = ROLE_ICONS[member.role];
          const roleColor = ROLE_COLORS[member.role];
          return (
            <div
              key={member.id}
              className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bloom)]/10 text-sm font-medium text-[var(--color-bloom)]">
                {member.user?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{member.user?.fullName || member.user?.username || 'Unknown'}</div>
                <div className="text-sm text-[var(--color-text-tertiary)]">{member.user?.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <RoleIcon className={`h-4 w-4 ${roleColor}`} />
                {canManage && member.role !== 'owner' && (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.userId, e.target.value as OrgRole)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                )}
                {canManage && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="rounded-lg p-1 text-[var(--color-text-tertiary)] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
