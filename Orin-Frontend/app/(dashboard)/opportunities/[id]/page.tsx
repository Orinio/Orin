'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Globe, DollarSign, Clock, ExternalLink, Bookmark, Sparkles } from 'lucide-react';
import { useOpportunities } from '@/lib/queries';
import { getOpportunityTypeLabel } from '@/lib/utils';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: opportunities = [], isLoading: loading } = useOpportunities({});
  const opp = opportunities.find(o => o.id === id);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-[var(--color-border)]" />
        <div className="h-10 w-96 rounded bg-[var(--color-border)]" />
        <div className="h-48 w-full rounded bg-[var(--color-border)]" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="max-w-2xl py-16 text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>Opportunity not found</h2>
        <Link href="/opportunities" className="mt-3 inline-block text-sm font-medium" style={{ color: 'var(--color-bloom)' }}>
          &larr; Back to opportunities
        </Link>
      </div>
    );
  }

  const formatSalary = () => {
    if (!opp.salaryMin && !opp.salaryMax) return null;
    const currency = opp.salaryCurrency || '$';
    if (opp.salaryMin && opp.salaryMax) return `${currency}${(opp.salaryMin / 1000).toFixed(0)}k – ${currency}${(opp.salaryMax / 1000).toFixed(0)}k`;
    if (opp.salaryMin) return `From ${currency}${(opp.salaryMin / 1000).toFixed(0)}k`;
    return `Up to ${currency}${(opp.salaryMax! / 1000).toFixed(0)}k`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <button onClick={() => router.back()} className="hover:underline flex items-center gap-1" style={{ color: 'var(--color-bloom)' }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span>/</span>
        <span>Opportunity detail</span>
      </header>

      <article className="card-premium p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
              {opp.company.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--color-bloom)' }}>{getOpportunityTypeLabel(opp.type)}</p>
              <h1 className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>{opp.title}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{opp.company}</p>
            </div>
          </div>
          {opp.matchPercentage !== undefined && (
            <span className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>
              {opp.matchPercentage}% match
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {opp.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{opp.location}</span>}
          {opp.isRemote && <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5" style={{ backgroundColor: 'var(--color-ember)12', color: 'var(--color-ember)' }}><Globe className="h-4 w-4" />Remote</span>}
          {formatSalary() && <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{formatSalary()}</span>}
          {opp.applyDeadline && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />Deadline: {new Date(opp.applyDeadline).toLocaleDateString()}</span>}
        </div>

        {opp.description && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>About this opportunity</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{opp.description}</p>
          </div>
        )}

        {opp.requiredSkills.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Required skills</h2>
            <div className="flex flex-wrap gap-2">
              {opp.requiredSkills.map((skill) => (
                <span key={skill} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {opp.niceToHave.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>Nice to have</h3>
            <div className="flex flex-wrap gap-2">
              {opp.niceToHave.map((skill: string) => (
                <span key={skill} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <a href={opp.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ backgroundColor: 'var(--color-bloom)' }}>
            <ExternalLink className="h-4 w-4" />
            Apply Now
          </a>
          <button className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <Bookmark className="h-4 w-4" /> Save
          </button>
        </div>
      </article>

      {opp.matchPercentage !== undefined && (
        <div className="card-premium p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Match Analysis</h2>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            You match {opp.matchPercentage}% of the required skills for this {getOpportunityTypeLabel(opp.type).toLowerCase()} position at {opp.company}.
          </p>
        </div>
      )}
    </div>
  );
}
