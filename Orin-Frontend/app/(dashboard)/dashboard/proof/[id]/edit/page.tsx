'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, Database } from '@/lib/supabase';
import { mapDbProofToProof } from '@/lib/utils';
import type { Proof, ProofSourceType } from '@/lib/types';

const SOURCE_TYPES: ProofSourceType[] = ['github', 'kaggle', 'certificate', 'hackathon', 'project', 'blog', 'demo', 'other'];

export default function EditProofPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [proof, setProof] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<ProofSourceType>('github');
  const [sourceUrl, setSourceUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [skillsExtracted, setSkillsExtracted] = useState('');
  const [whatItProves, setWhatItProves] = useState('');

  useEffect(() => {
    async function fetchProof() {
      try {
        if (!supabase) return;
        const { data, error: dbError } = await supabase
          .from('proof_cards')
          .select('*')
          .eq('id', id)
          .is('deleted_at', null)
          .maybeSingle();
        if (dbError) throw new Error(dbError.message);
        if (data) {
          const p = mapDbProofToProof(data);
          setProof(p);
          setTitle(p.title);
          setDescription(p.description || '');
          setSourceType(p.sourceType);
          setSourceUrl(p.sourceUrl || '');
          setVisibility(p.visibility);
          setSkillsExtracted(p.skillsExtracted.join(', '));
          setWhatItProves(p.whatItProves.join(', '));
        }
      } catch (e) {
        console.warn('Failed to load proof', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProof();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const body = {
        title,
        description: description || null,
        source_type: sourceType,
        source_url: sourceUrl || null,
        visibility,
        skills_extracted: skillsExtracted.split(',').map((s) => s.trim()).filter(Boolean),
        what_it_proves: whatItProves.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (supabase) {
        const { error: updateError } = await supabase
          .from('proof_cards')
          .update(body)
          .eq('id', id);

        if (updateError) throw new Error(updateError.message);
      }

      setSaved(true);
      setTimeout(() => router.push(`/dashboard/proof/${id}`), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8">
        <div className="h-6 w-32 animate-pulse rounded bg-[var(--color-neutral-border)]" />
        <div className="h-10 w-full animate-pulse rounded bg-[var(--color-neutral-border)]" />
        <div className="h-32 w-full animate-pulse rounded bg-[var(--color-neutral-border)]" />
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="text-xl font-semibold">Proof not found</h2>
        <Link href="/dashboard" className="mt-2 inline-block text-sm text-[var(--color-primary-emerald)] hover:underline">
          &larr; Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3 text-sm text-[var(--color-neutral-text-secondary)]">
        <Link href={`/dashboard/proof/${id}`} className="text-[var(--color-primary-emerald)] hover:underline">
          &larr; Back to proof
        </Link>
        <span>/</span>
        <span>Edit proof</span>
      </div>

      <header>
        <h1 className="text-2xl font-semibold font-serif">Edit Proof</h1>
        <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
          Update the details of your proof card.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-text)]">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-text)]">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-text)]">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as ProofSourceType)}
              className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-neutral-text)]">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-text)]">Source URL</label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-text)]">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skillsExtracted}
            onChange={(e) => setSkillsExtracted(e.target.value)}
            placeholder="React, TypeScript, Node.js"
            className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-text)]">
            What this proves (comma-separated)
          </label>
          <input
            type="text"
            value={whatItProves}
            onChange={(e) => setWhatItProves(e.target.value)}
            placeholder="System design, API development, Team collaboration"
            className="mt-1 w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-primary-emerald)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-emerald)]/90 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">
              Saved! Redirecting...
            </span>
          )}
          <Link
            href={`/dashboard/proof/${id}`}
            className="rounded-lg border border-[var(--color-neutral-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
