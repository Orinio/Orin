'use client';

import { useState } from 'react';
import { useOrg } from '@/lib/org-context';
import { ChevronDown, Plus, Building2, User } from 'lucide-react';

export function OrgSwitcher() {
  const { organizations, currentOrg, currentOrgId, switchOrg } = useOrg();
  const [open, setOpen] = useState(false);

  const handleSwitch = async (orgId: string | 'personal') => {
    await switchOrg(orgId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition hover:border-[var(--color-bloom)]/30"
      >
        {currentOrg ? (
          <>
            <Building2 className="h-4 w-4 text-[var(--color-bloom)]" />
            <span className="max-w-[120px] truncate font-medium">{currentOrg.name}</span>
          </>
        ) : (
          <>
            <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <span className="font-medium">Personal</span>
          </>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            {/* Personal context */}
            <button
              onClick={() => handleSwitch('personal')}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[var(--color-bg)] ${
                !currentOrgId ? 'bg-[var(--color-bg)]' : ''
              }`}
            >
              <User className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <div>
                <div className="font-medium">Personal</div>
                <div className="text-xs text-[var(--color-text-tertiary)]">Your individual workspace</div>
              </div>
            </button>

            {organizations.length > 0 && (
              <div className="border-t border-[var(--color-border)]">
                <div className="px-4 py-2 text-xs font-medium text-[var(--color-text-tertiary)] uppercase">
                  Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitch(org.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[var(--color-bg)] ${
                      currentOrgId === org.id ? 'bg-[var(--color-bg)]' : ''
                    }`}
                  >
                    <Building2 className="h-4 w-4 text-[var(--color-bloom)]" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{org.name}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">
                        {(org as any).myRole || 'member'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-[var(--color-border)]">
              <a
                href="/dashboard/org/new"
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-[var(--color-bg)]"
              >
                <Plus className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <span className="font-medium">Create Organization</span>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
