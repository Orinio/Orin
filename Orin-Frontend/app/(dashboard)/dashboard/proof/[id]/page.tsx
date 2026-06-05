'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { mapDbProofToProof, getStatusConfig, formatNumber, formatRelativeTime, getProofTypeColor } from "@/lib/utils";
import type { Proof } from "@/lib/types";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface StatusConfig {
  label: string;
  className: string;
}

interface AIAnalysis {
  thinking: string;
  answer: string;
  tokensUsed: number;
}

export default function ProofDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [proof, setProof] = useState<Proof | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProof() {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from('proof_cards')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (data) setProof(mapDbProofToProof(data));
      } catch (e) {
        console.warn('Failed to fetch proof:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchProof();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        <div className="h-4 w-48 rounded bg-[var(--color-neutral-border)]" />
        <div className="h-10 w-96 rounded bg-[var(--color-neutral-border)]" />
        <div className="h-32 w-full rounded bg-[var(--color-neutral-border)]" />
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

  const statusConfig: StatusConfig = getStatusConfig(proof.verificationStatus);

  const getEvidenceItems = () => {
    const items: { label: string; detail: string; action?: string; href?: string }[] = [];

    if (proof.sourceUrl) {
      items.push({
        label: `${proof.sourceType.charAt(0).toUpperCase() + proof.sourceType.slice(1)} source`,
        detail: proof.sourceUrl,
        action: "Open",
        href: proof.sourceUrl,
      });
    }

    switch (proof.sourceType) {
      case 'github':
        if (proof.metadata) {
          const meta = proof.metadata as Record<string, unknown>;
          if (meta.language) items.push({ label: "Primary language", detail: String(meta.language) });
          if (meta.stars !== undefined) items.push({ label: "Stars", detail: String(meta.stars) });
          if (meta.lastCommit) items.push({ label: "Last commit", detail: String(meta.lastCommit) });
        }
        break;
      case 'kaggle':
        if (proof.metadata) {
          const meta = proof.metadata as Record<string, unknown>;
          if (meta.leaderboardRank) items.push({ label: "Leaderboard rank", detail: String(meta.leaderboardRank) });
          if (meta.dataset) items.push({ label: "Dataset", detail: String(meta.dataset) });
        }
        break;
      case 'certificate':
        if (proof.metadata) {
          const meta = proof.metadata as Record<string, unknown>;
          if (meta.issuer) items.push({ label: "Issuer", detail: String(meta.issuer) });
          if (meta.issuedDate) items.push({ label: "Issued", detail: String(meta.issuedDate) });
        }
        break;
      case 'hackathon':
        if (proof.metadata) {
          const meta = proof.metadata as Record<string, unknown>;
          if (meta.placement) items.push({ label: "Placement", detail: String(meta.placement) });
          if (meta.teamSize) items.push({ label: "Team size", detail: String(meta.teamSize) });
        }
        break;
      case 'project':
      case 'demo':
        if (proof.metadata) {
          const meta = proof.metadata as Record<string, unknown>;
          if (meta.deploymentUrl) items.push({ label: "Live demo", detail: String(meta.deploymentUrl), action: "Visit", href: String(meta.deploymentUrl) });
          if (meta.technologies) items.push({ label: "Technologies", detail: String(meta.technologies) });
        }
        break;
      case 'blog':
        if (proof.metadata) {
          const meta = proof.metadata as Record<string, unknown>;
          if (meta.readTime) items.push({ label: "Read time", detail: String(meta.readTime) });
          if (meta.publication) items.push({ label: "Published on", detail: String(meta.publication) });
        }
        break;
      default:
        break;
    }

    return items;
  };

  const evidenceItems = getEvidenceItems();

  const analyzeProofQuality = async () => {
    if (!proof) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          proofData: {
            title: proof.title,
            description: proof.description,
            sourceType: proof.sourceType,
            sourceUrl: proof.sourceUrl,
            skills: proof.skillsExtracted,
            whatItProves: proof.whatItProves,
            metadata: proof.metadata,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze proof');
      }

      const data = await response.json();
      setAiAnalysis({
        thinking: data.result.thinking,
        answer: data.result.answer,
        tokensUsed: data.result.tokensUsed,
      });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Failed to analyze proof');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-[var(--color-neutral-text-secondary)]">
          <Link href="/dashboard" className="text-[var(--color-primary-emerald)] hover:underline">
            &larr; Back
          </Link>
          <span>/</span>
          <span>Proof detail</span>
        </div>
        <div className="flex gap-2">
          <form action="/api/proof/share" method="POST" className="inline">
            <input type="hidden" name="proofId" value={proof.id} />
            <button type="submit" className="rounded-md border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]">
              Share
            </button>
          </form>
          <Link
            href={`/dashboard/proof/${proof.id}/edit`}
            className="rounded-md border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]"
          >
            Edit
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h1 className="text-3xl font-semibold md:text-4xl font-serif">{proof.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-neutral-text-secondary)]">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${getProofTypeColor(proof.sourceType)}20`, color: getProofTypeColor(proof.sourceType) }}
          >
            {proof.sourceType}
          </span>
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
          <span>&middot; {formatNumber(proof.viewCount)} views</span>
          <span>&middot; Updated {formatRelativeTime(proof.updatedAt)}</span>
          {proof.visibility === 'public' && (
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Public</span>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {proof.description && (
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
              <h2 className="text-xl font-semibold font-serif">What it is</h2>
              <p className="mt-2 text-sm text-[var(--color-neutral-text-secondary)]">{proof.description}</p>
              {proof.sourceUrl && (
                <p className="mt-3 text-sm">
                  <a className="text-[var(--color-primary-emerald)] break-all hover:underline" href={proof.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {proof.sourceUrl}
                  </a>
                </p>
              )}
            </div>
          )}

          {proof.skillsExtracted.length > 0 && (
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
              <h2 className="text-xl font-semibold font-serif">Skills extracted</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {proof.skillsExtracted.map((skill) => (
                  <span key={skill} className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--color-primary-emerald)]">
                    {skill}
                  </span>
                ))}
                {proof.skillsUserAdded.map((skill) => (
                  <span key={skill} className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {proof.whatItProves.length > 0 && (
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
              <h2 className="text-xl font-semibold font-serif">What this proves</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--color-neutral-text-secondary)]">
                {proof.whatItProves.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}

          {evidenceItems.length > 0 && (
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
              <h2 className="text-xl font-semibold font-serif">Proof evidence</h2>
              <div className="mt-3 space-y-3 text-sm text-[var(--color-neutral-text-secondary)]">
                {evidenceItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-neutral-border)] p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--color-neutral-text)]">{item.label}</p>
                      <p className="truncate">{item.detail}</p>
                    </div>
                    {item.href && (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="ml-4 shrink-0 rounded-md px-3 py-1 text-xs font-semibold text-[var(--color-primary-emerald)] hover:bg-[var(--color-primary-soft)]">
                        {item.action || 'View'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <h2 className="text-lg font-semibold font-serif">Visibility</h2>
            <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-neutral-bg)] p-3 text-xs text-[var(--color-neutral-text-secondary)]">
              {proof.visibility === 'public' ? 'Public - visible to everyone' : proof.visibility === 'unlisted' ? 'Unlisted - accessible via link' : 'Private - only visible to you'}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-md bg-[var(--color-primary-emerald)] px-3 py-1.5 text-xs font-semibold text-white">Copy link</button>
              <button className="rounded-md border border-[var(--color-neutral-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]">Email recruiter</button>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <h2 className="text-lg font-semibold font-serif">Analytics</h2>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-neutral-text-secondary)]">Total views</span>
                <span className="text-sm font-semibold text-[var(--color-neutral-text)]">{formatNumber(proof.viewCount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-neutral-text-secondary)]">Verified</span>
                <span className="text-sm font-semibold text-[var(--color-neutral-text)]">{proof.verificationStatus === 'verified' ? 'Yes' : 'No'}</span>
              </div>
              {proof.verifiedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-neutral-text-secondary)]">Verified on</span>
                  <span className="text-sm font-semibold text-[var(--color-neutral-text)]">{proof.verifiedAt.toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-neutral-text-secondary)]">Created</span>
                <span className="text-sm font-semibold text-[var(--color-neutral-text)]">{proof.createdAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-serif">AI Quality Analysis</h2>
              <button
                onClick={analyzeProofQuality}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-emerald)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-emerald)]/90 disabled:opacity-60"
              >
                {aiLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {aiLoading ? 'Analyzing...' : 'Analyze Quality'}
              </button>
            </div>

            {aiError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{aiError}</p>
              </div>
            )}

            {aiAnalysis && (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-[var(--color-neutral-bg)] p-3">
                  <p className="text-xs font-medium text-[var(--color-neutral-text-secondary)] mb-1">AI Assessment</p>
                  <p className="text-sm text-[var(--color-neutral-text)] whitespace-pre-wrap">{aiAnalysis.answer}</p>
                </div>
                {aiAnalysis.thinking && (
                  <div className="rounded-lg bg-[var(--color-neutral-bg)] p-3">
                    <p className="text-xs font-medium text-[var(--color-neutral-text-secondary)] mb-1">Reasoning</p>
                    <p className="text-xs text-[var(--color-neutral-text-tertiary)] italic">{aiAnalysis.thinking}</p>
                  </div>
                )}
                <p className="text-xs text-[var(--color-neutral-text-tertiary)]">Tokens used: {aiAnalysis.tokensUsed}</p>
              </div>
            )}

            {!aiAnalysis && !aiLoading && !aiError && (
              <p className="mt-3 text-xs text-[var(--color-neutral-text-tertiary)]">
                Get AI-powered feedback on your proof quality, description, and skills.
              </p>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
