'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Github,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface GeneratedProof {
  title: string;
  description: string;
  skills: string[];
  whatItProves: string[];
  suggestedType: string;
}

interface UrlImportProps {
  onProofGenerated: (proof: GeneratedProof & { sourceUrl: string; sourceType: string; rawData?: Record<string, unknown> }) => void;
}

export default function UrlImport({ onProofGenerated }: UrlImportProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedProof | null>(null);

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const isGithubUrl = url.includes('github.com/');
  const isKaggleUrl = url.includes('kaggle.com/');
  const canSubmit = isValidUrl(url) && (isGithubUrl || isKaggleUrl) && !loading;

  const handleGenerate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setGenerated(null);

    try {
      const res = await fetch('/api/proofs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to generate proof');
        return;
      }

      setGenerated(data.proof);
    } catch (e) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!generated) return;
    onProofGenerated({
      ...generated,
      sourceUrl: url,
      sourceType: generated.suggestedType || (isGithubUrl ? 'github' : 'kaggle'),
    });
  };

  const handleReset = () => {
    setUrl('');
    setGenerated(null);
    setError(null);
  };

  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
          <Sparkles className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Import from URL</h3>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Paste a GitHub repo URL — AI will generate your proof card
          </p>
        </div>
      </div>

      {!generated ? (
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-[var(--color-bloom)]/20"
              style={{ borderColor: error ? 'var(--color-pulse)' : 'var(--color-border)' }}
            >
              {isGithubUrl ? (
                <Github className="h-4 w-4 shrink-0" style={{ color: '#333' }} />
              ) : (
                <Link2 className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              )}
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
                placeholder="https://github.com/owner/repo"
                className="flex-1 bg-transparent text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
                style={{ color: 'var(--color-ink)' }}
              />
              {url && (
                <button onClick={() => { setUrl(''); setError(null); }} className="shrink-0 text-[var(--color-text-tertiary)] hover:opacity-70">
                  ✕
                </button>
              )}
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--color-pulse)' }}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </motion.p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Proof
                </>
              )}
            </button>
            {isGithubUrl && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                GitHub repository detected
              </span>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Generated proof preview */}
          <div className="rounded-xl p-4" style={{ border: '1px solid var(--color-bloom)30', backgroundColor: 'var(--color-bloom)04' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{generated.title}</h4>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                  {generated.description}
                </p>
              </div>
              <Check className="h-5 w-5 shrink-0" style={{ color: 'var(--color-bloom)' }} />
            </div>

            {generated.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {generated.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {generated.whatItProves.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                  What this proves
                </p>
                {generated.whatItProves.map((prove, i) => (
                  <p key={i} className="text-xs" style={{ color: 'var(--color-ink)' }}>
                    • {prove}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              Use this proof
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
            >
              Try another URL
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <ExternalLink className="h-3 w-3" />
              View source
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
