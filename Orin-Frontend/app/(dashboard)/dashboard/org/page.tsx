'use client';

import { useOrg } from '@/lib/org-context';
import { Building2, Users, Settings, Crown, Plus } from 'lucide-react';
import Link from 'next/link';

export default function OrgPage() {
  const { organizations, currentOrg, loading } = useOrg();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-bloom)] border-t-transparent" />
      </div>
    );
  }

  if (currentOrg) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{currentOrg.name}</h1>
            <p className="text-[var(--color-text-secondary)]">
              {currentOrg.memberCount} member{currentOrg.memberCount !== 1 ? 's' : ''} · {currentOrg.myRole}
            </p>
          </div>
          <Link
            href="/dashboard/org/settings"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm transition hover:border-[var(--color-bloom)]/30"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>

        {/* Members preview */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5" />
              Members
            </h2>
            <Link
              href="/dashboard/org/members"
              className="text-sm text-[var(--color-bloom)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentOrg.members.slice(0, 6).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bloom)]/10 text-xs font-medium text-[var(--color-bloom)]">
                  {member.user?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {member.user?.fullName || member.user?.username || 'Unknown'}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{member.role}</div>
                </div>
                {member.role === 'owner' && <Crown className="h-3 w-3 text-yellow-500" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Link
          href="/dashboard/org/new"
          className="flex items-center gap-2 rounded-xl bg-[var(--color-bloom)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <h3 className="mb-2 text-lg font-semibold">No organizations yet</h3>
          <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
            Create an organization to collaborate with your team.
          </p>
          <Link
            href="/dashboard/org/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-bloom)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/dashboard/org/${org.id}`}
              className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition hover:border-[var(--color-bloom)]/30"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-bloom)]/10">
                <Building2 className="h-6 w-6 text-[var(--color-bloom)]" />
              </div>
              <h3 className="mb-1 font-semibold group-hover:text-[var(--color-bloom)]">{org.name}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {(org as any).myRole || 'member'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
