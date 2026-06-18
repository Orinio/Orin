'use client';

import { useState } from 'react';
import { useOrg } from '@/lib/org-context';
import { supabase } from '@/lib/supabase';
import { Settings, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrgSettingsPage() {
  const router = useRouter();
  const { currentOrg, myRole, refreshCurrentOrg } = useOrg();
  const [name, setName] = useState(currentOrg?.name || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canEdit = myRole === 'owner' || myRole === 'admin';
  const canDelete = myRole === 'owner';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error?.message || 'Failed to save');
        return;
      }

      setSuccess(true);
      await refreshCurrentOrg();
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentOrg) return;
    if (!confirm('Are you sure you want to delete this organization? This cannot be undone.')) return;

    setDeleting(true);

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations/${currentOrg.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.session?.access_token}` },
      });

      if (resp.ok) {
        router.push('/dashboard/org');
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="py-20 text-center text-[var(--color-text-secondary)]">
        Select an organization to manage settings.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Settings className="h-6 w-6" />
          {currentOrg.name} — Settings
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Manage your organization settings.
        </p>
      </div>

      {canEdit ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Slug</label>
            <input
              type="text"
              value={currentOrg.slug}
              disabled
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm opacity-60"
            />
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Slug cannot be changed.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Settings saved successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !name}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-bloom)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-secondary)]">
          You don&apos;t have permission to edit this organization.
        </div>
      )}

      {canDelete && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="mb-2 font-semibold text-red-700">Danger Zone</h3>
          <p className="mb-4 text-sm text-red-600">
            Deleting this organization will remove all members and data. This action cannot be undone.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Organization'}
          </button>
        </div>
      )}
    </div>
  );
}
