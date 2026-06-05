'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  GitFork,
  Upload,
  Link2,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import type { ProofSourceType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SourceOption {
  type: ProofSourceType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresUrl: boolean;
  urlPlaceholder?: string;
}

const sourceOptions: SourceOption[] = [
  {
    type: 'github',
    title: 'GitHub',
    description: 'Import repositories, stars, and commit history.',
    icon: <GitFork className="w-5 h-5" />,
    color: 'var(--color-ink)',
    requiresUrl: true,
    urlPlaceholder: 'https://github.com/username/repo',
  },
  {
    type: 'certificate',
    title: 'Certificate / PDF',
    description: 'Add hackathon wins, internships, and course certificates.',
    icon: <Upload className="w-5 h-5" />,
    color: 'var(--color-ember)',
    requiresUrl: false,
  },
  {
    type: 'kaggle',
    title: 'Kaggle / Codeforces',
    description: 'Connect competitive profiles and verified rankings.',
    icon: <Link2 className="w-5 h-5" />,
    color: 'var(--color-pulse)',
    requiresUrl: true,
    urlPlaceholder: 'https://kaggle.com/username',
  },
  {
    type: 'hackathon',
    title: 'Hackathon',
    description: 'Showcase hackathon projects and wins.',
    icon: <Globe className="w-5 h-5" />,
    color: 'var(--color-spark)',
    requiresUrl: true,
    urlPlaceholder: 'https://devpost.com/user/project',
  },
  {
    type: 'blog',
    title: 'Blog Post',
    description: 'Link published articles, tutorials, or technical writing.',
    icon: <Globe className="w-5 h-5" />,
    color: '#8B5CF6',
    requiresUrl: true,
    urlPlaceholder: 'https://medium.com/@user/article',
  },
  {
    type: 'demo',
    title: 'Demo / Live Project',
    description: 'Share deployed apps, prototypes, or interactive demos.',
    icon: <Globe className="w-5 h-5" />,
    color: '#06B6D4',
    requiresUrl: true,
    urlPlaceholder: 'https://myapp.vercel.app',
  },
];

export function AddProofSourceCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<SourceOption | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setSelected(null);
    setUrl('');
    setLoading(false);
    setSuccess(false);
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  const handleSubmit = async () => {
    if (!selected) return;
    if (selected.requiresUrl && !url.trim()) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_type: selected.type,
          source_url: url.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add source');
      }

      setSuccess(true);
      setTimeout(() => handleClose(), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-dashed">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
              + Add Proof Source
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Connect GitHub, upload certificate, link Kaggle, or paste a custom proof URL.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setIsOpen(true)}>
            Add source
          </Button>
        </div>
      </Card>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add proof source"
            className="w-full max-w-lg rounded-2xl p-6 shadow-xl bg-[var(--color-surface)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Add proof source
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Choose a source type to create verified proof cards.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-[var(--color-surface-dim)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-10">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Source added successfully!
                </p>
              </div>
            ) : !selected ? (
              <div className="mt-4 space-y-2">
                {sourceOptions.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => setSelected(option)}
                    className={cn(
                      'w-full rounded-xl p-4 transition-all duration-200 flex items-start gap-3 text-left',
                      'border border-[var(--color-border)] hover:border-[var(--color-ink)] hover:shadow-md',
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--color-surface-dim)', color: option.color }}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {option.title}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {option.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <button
                  onClick={() => {
                    setSelected(null);
                    setUrl('');
                    setError('');
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--color-ink)]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  ← Change source type
                </button>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-dim)]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ color: selected.color }}
                  >
                    {selected.icon}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {selected.title}
                  </span>
                </div>

                {selected.requiresUrl && (
                  <Input
                    label="Source URL"
                    placeholder={selected.urlPlaceholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    id="source-url"
                  />
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} loading={loading} disabled={loading}>
                    Add Source
                  </Button>
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
