'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { ProofSourceType } from '@/lib/types';

const sourceTypes: { value: ProofSourceType; label: string; icon: string; placeholder: string; description: string }[] = [
  { value: 'github', label: 'GitHub', icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z', placeholder: 'https://github.com/username/repo', description: 'Repositories, contributions, and commit history' },
  { value: 'kaggle', label: 'Kaggle', icon: 'M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.233-.036.315L12.1 15.271l6.689 8.275c.07.093.092.186.036.313z', placeholder: 'https://kaggle.com/username', description: 'Competitions, datasets, and notebooks' },
  { value: 'certificate', label: 'Certificate', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', placeholder: 'https://certificate-url.com/verify/abc123', description: 'Online courses, certifications, and badges' },
  { value: 'hackathon', label: 'Hackathon', icon: 'M13 10V3L4 14h7v7l9-11h-7z', placeholder: 'https://devpost.com/project/my-project', description: 'Hackathon wins, participation, and projects' },
  { value: 'project', label: 'Project', icon: 'M3 3h18v18H3zM3 9h18M9 21V9', placeholder: 'https://myproject.com', description: 'Personal or professional projects' },
  { value: 'blog', label: 'Blog / Article', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', placeholder: 'https://medium.com/@username/article', description: 'Technical blog posts and articles' },
  { value: 'demo', label: 'Demo / Live Site', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', placeholder: 'https://demo.mysite.com', description: 'Live deployments and demo links' },
  { value: 'other', label: 'Other', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', placeholder: 'https://example.com/proof', description: 'Any other proof of work' },
];

export default function AddProofSourcePage() {
  const [sourceType, setSourceType] = useState<ProofSourceType>('github');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedType = sourceTypes.find((t) => t.value === sourceType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to add a source');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: sourceType,
          source_url: sourceUrl,
          source_name: sourceName || sourceUrl,
          description,
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add source');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[var(--color-neutral-text)] font-serif">Add Proof Source</h1>
        <p className="mt-1 text-[var(--color-neutral-text-secondary)]">
          Connect a platform or link to add proof of your work.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--color-neutral-text)] mb-3">
            Source Type
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {sourceTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => { setSourceType(type.value); setSourceUrl(''); }}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition ${sourceType === type.value ? 'border-[var(--color-primary-emerald)] bg-[var(--color-primary-soft)] text-[var(--color-primary-emerald)]' : 'border-[var(--color-neutral-border)] text-[var(--color-neutral-text-secondary)] hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]'}`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={type.icon} />
                </svg>
                {type.label}
              </button>
            ))}
          </div>
          {selectedType && (
            <p className="mt-2 text-xs text-[var(--color-neutral-text-tertiary)]">{selectedType.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="sourceUrl" className="block text-sm font-medium text-[var(--color-neutral-text)] mb-1.5">
            Source URL
          </label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder={selectedType?.placeholder}
            required
            className="w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        <div>
          <label htmlFor="sourceName" className="block text-sm font-medium text-[var(--color-neutral-text)] mb-1.5">
            Display Name <span className="text-[var(--color-neutral-text-tertiary)]">(optional)</span>
          </label>
          <input
            id="sourceName"
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="My awesome project"
            className="w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[var(--color-neutral-text)] mb-1.5">
            Description <span className="text-[var(--color-neutral-text-tertiary)]">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what this proof demonstrates..."
            className="w-full resize-none rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3.5 py-2.5 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] transition focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !sourceUrl}
            className="btn-green rounded-lg px-6 py-2.5 font-semibold text-white text-sm disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Adding...
              </>
            ) : (
              'Add Source'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--color-neutral-border)] px-6 py-2.5 font-semibold text-[var(--color-neutral-text)] text-sm hover:bg-[var(--color-neutral-surface-alt)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
