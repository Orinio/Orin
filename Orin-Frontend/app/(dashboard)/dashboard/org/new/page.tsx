'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/lib/org-context';
import { Building2 } from 'lucide-react';

export default function NewOrgPage() {
  const router = useRouter();
  const { refreshOrgs, switchOrg } = useOrg();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 60)
      );
    }
  };

  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setSlug(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase!.auth.getSession();
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error?.message || 'Failed to create organization');
        return;
      }

      await refreshOrgs();
      await switchOrg(data.data.id);
      router.push('/dashboard/org');
    } catch {
      setError('Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Organization</h1>
        <p className="text-[var(--color-text-secondary)]">
          Set up a workspace for your team.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Organization Name</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Corp"
              required
              minLength={2}
              maxLength={100}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="acme-corp"
            required
            minLength={2}
            maxLength={60}
            pattern="[a-z0-9\-]+"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
          />
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Letters, numbers, and hyphens only. Used in URLs.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !name}
          className="w-full rounded-xl bg-[var(--color-bloom)] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
      </form>
    </div>
  );
}
