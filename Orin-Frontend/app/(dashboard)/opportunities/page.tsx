'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getOpportunityTypeLabel } from '@/lib/utils';
import { Sparkles, TrendingUp, MapPin, Globe, DollarSign, Clock, Bookmark, X, ChevronDown, ChevronUp, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import type { Opportunity, OpportunityType, OpportunityStatus } from '@/lib/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SkillMatch {
  opportunityId: string;
  title: string;
  company: string;
  type: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

interface SkillAnalysis {
  topSkills: { name: string; count: number }[];
  totalSkills: number;
  uniqueSkills: number;
  skillGaps: string[];
  recommendations: string[];
}

interface AIInsights {
  answer: string;
  thinking: string;
  tokensUsed: number;
}

const TYPE_FILTERS: OpportunityType[] = ['internship', 'job', 'scholarship', 'mentorship', 'hackathon', 'research'];
const SORT_OPTIONS = [
  { value: 'match', label: 'Best match' },
  { value: 'recent', label: 'Most recent' },
  { value: 'salary', label: 'Salary (high to low)' },
] as const;

export default function OpportunitiesPage() {
  return (
    <ErrorBoundary>
      <OpportunitiesContent />
    </ErrorBoundary>
  );
}

function OpportunitiesContent() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [skillMatches, setSkillMatches] = useState<SkillMatch[]>([]);
  const [skillAnalysis, setSkillAnalysis] = useState<SkillAnalysis | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [userOpps, setUserOpps] = useState<Record<string, OpportunityStatus>>({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<OpportunityType | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'salary'>('match');
  const [showInsights, setShowInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/opportunities');
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      } catch (e) {
        console.warn('Failed to fetch opportunities:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchAIMatches = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/match-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20, includeSkillGaps: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch AI matches');
      }

      const data = await response.json();
      setSkillMatches(data.matches || []);
      setSkillAnalysis(data.skillAnalysis || null);
      setAiInsights(data.aiInsights || null);
    } catch (e) {
      console.warn('Failed to fetch AI matches:', e);
      setError(e instanceof Error ? e.message : 'Failed to load AI insights');
    } finally {
      setAiLoading(false);
    }
  };

  const getMatchForOpp = (oppId: string) => skillMatches.find(m => m.opportunityId === oppId);

  const filtered = useMemo(() => {
    let result = [...opportunities];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.company.toLowerCase().includes(q) ||
          o.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (typeFilter) {
      result = result.filter((o) => o.type === typeFilter);
    }

    switch (sortBy) {
      case 'match':
        result.sort((a, b) => {
          const aMatch = getMatchForOpp(a.id)?.matchScore || a.matchPercentage || 0;
          const bMatch = getMatchForOpp(b.id)?.matchScore || b.matchPercentage || 0;
          return bMatch - aMatch;
        });
        break;
      case 'recent':
        result.sort((a, b) => (b.postedAt?.getTime() || 0) - (a.postedAt?.getTime() || 0));
        break;
      case 'salary':
        result.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
        break;
    }

    return result;
  }, [opportunities, search, typeFilter, sortBy, skillMatches]);

  const handleSave = async (oppId: string) => {
    setUserOpps((prev) => ({ ...prev, [oppId]: 'saved' }));
    try {
      await fetch('/api/opportunities/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId, status: 'saved' }),
      });
    } catch {}
  };

  const handleDismiss = async (oppId: string) => {
    setUserOpps((prev) => ({ ...prev, [oppId]: 'dismissed' }));
    try {
      await fetch('/api/opportunities/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: oppId, status: 'dismissed' }),
      });
    } catch {}
  };

  const formatSalary = (opp: Opportunity) => {
    if (!opp.salaryMin && !opp.salaryMax) return null;
    const currency = opp.salaryCurrency || '$';
    if (opp.salaryMin && opp.salaryMax) {
      return `${currency}${(opp.salaryMin / 1000).toFixed(0)}k - ${currency}${(opp.salaryMax / 1000).toFixed(0)}k`;
    }
    if (opp.salaryMin) return `From ${currency}${(opp.salaryMin / 1000).toFixed(0)}k`;
    return `Up to ${currency}${(opp.salaryMax! / 1000).toFixed(0)}k`;
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--color-neutral-text)] font-serif">Opportunities</h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
            AI-matched opportunities based on your verified proof portfolio.
          </p>
        </div>
        <button
          onClick={fetchAIMatches}
          disabled={aiLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-emerald)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-emerald)]/90 disabled:opacity-60"
        >
          {aiLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {aiLoading ? 'Analyzing...' : 'AI Match'}
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {skillAnalysis && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-[var(--color-primary-emerald)]" />
              <h3 className="font-semibold text-[var(--color-neutral-text)]">Your Skills</h3>
            </div>
            <p className="text-3xl font-bold text-[var(--color-primary-emerald)]">{skillAnalysis.uniqueSkills}</p>
            <p className="text-xs text-[var(--color-neutral-text-secondary)] mt-1">unique skills from {skillAnalysis.totalSkills} total</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {skillAnalysis.topSkills.slice(0, 5).map((s) => (
                <span key={s.name} className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-emerald)]">
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-[var(--color-neutral-text)]">Skill Gaps</h3>
            </div>
            <p className="text-3xl font-bold text-amber-500">{skillAnalysis.skillGaps.length}</p>
            <p className="text-xs text-[var(--color-neutral-text-secondary)] mt-1">skills to learn for better matches</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {skillAnalysis.skillGaps.slice(0, 3).map((s) => (
                <span key={s} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-[var(--color-neutral-text)]">Match Score</h3>
            </div>
            <p className="text-3xl font-bold text-blue-500">
              {skillMatches.length > 0 ? Math.round(skillMatches.reduce((a, m) => a + m.matchScore, 0) / skillMatches.length) : '--'}%
            </p>
            <p className="text-xs text-[var(--color-neutral-text-secondary)] mt-1">average match across opportunities</p>
          </div>
        </div>
      )}

      {aiInsights && (
        <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
          <button
            onClick={() => setShowInsights(!showInsights)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--color-primary-emerald)]" />
              <h3 className="font-semibold text-[var(--color-neutral-text)]">AI Career Insights</h3>
            </div>
            {showInsights ? <ChevronUp className="h-5 w-5 text-[var(--color-neutral-text-secondary)]" /> : <ChevronDown className="h-5 w-5 text-[var(--color-neutral-text-secondary)]" />}
          </button>
          {showInsights && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--color-neutral-text)] whitespace-pre-wrap">{aiInsights.answer}</p>
              {aiInsights.thinking && (
                <p className="text-xs text-[var(--color-neutral-text-tertiary)] italic">{aiInsights.thinking}</p>
              )}
              <p className="text-xs text-[var(--color-neutral-text-tertiary)]">Tokens used: {aiInsights.tokensUsed}</p>
            </div>
          )}
        </div>
      )}

      {skillAnalysis?.recommendations && skillAnalysis.recommendations.length > 0 && (
        <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-[var(--color-primary-emerald)]" />
            <h3 className="font-semibold text-[var(--color-neutral-text)]">Learning Path</h3>
          </div>
          <div className="space-y-2">
            {skillAnalysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[var(--color-neutral-text-secondary)]">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary-emerald)] flex-shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-text-tertiary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, company, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-neutral-text)] placeholder:text-[var(--color-neutral-text-tertiary)] focus:border-[var(--color-primary-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-soft)]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-bg)] px-3 py-2 text-sm text-[var(--color-neutral-text)] focus:border-[var(--color-primary-emerald)] focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${!typeFilter ? 'bg-[var(--color-primary-emerald)] text-white' : 'border border-[var(--color-neutral-border)] text-[var(--color-neutral-text-secondary)] hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]'}`}
        >
          All
        </button>
        {TYPE_FILTERS.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${typeFilter === type ? 'bg-[var(--color-primary-emerald)] text-white' : 'border border-[var(--color-neutral-border)] text-[var(--color-neutral-text-secondary)] hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)]'}`}
          >
            {getOpportunityTypeLabel(type)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5">
                <div className="h-4 w-24 rounded bg-[var(--color-neutral-border)]" />
                <div className="mt-2 h-6 w-48 rounded bg-[var(--color-neutral-border)]" />
                <div className="mt-1 h-4 w-32 rounded bg-[var(--color-neutral-border)]" />
                <div className="mt-4 h-10 rounded bg-[var(--color-neutral-border)]" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-6 text-center">
            <p className="text-[var(--color-neutral-text-secondary)]">No opportunities found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((opp) => {
              const oppStatus = userOpps[opp.id];
              const match = getMatchForOpp(opp.id);
              const matchScore = match?.matchScore ?? opp.matchPercentage;
              return (
                <div key={opp.id} className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-5 transition-all hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-neutral-surface-alt)] text-sm font-bold text-[var(--color-neutral-text)]">
                          {opp.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--color-primary-emerald)] tracking-wider">{getOpportunityTypeLabel(opp.type)}</p>
                          <h3 className="truncate font-semibold text-[var(--color-neutral-text)] text-lg">{opp.title}</h3>
                          <p className="text-sm text-[var(--color-neutral-text-secondary)]">{opp.company}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`ml-3 shrink-0 rounded px-2 py-1 text-xs font-medium ${getMatchColor(matchScore)}`}>
                      {matchScore}% match
                    </span>
                  </div>

                  {match && (
                    <div className="mt-3 rounded-lg bg-[var(--color-neutral-bg)] p-3">
                      <p className="text-xs font-medium text-[var(--color-neutral-text-secondary)] mb-1">AI Analysis</p>
                      {match.matchedSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs text-emerald-600">Matched:</span>
                          {match.matchedSkills.map((s) => (
                            <span key={s} className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">{s}</span>
                          ))}
                        </div>
                      )}
                      {match.missingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-amber-600">Learn:</span>
                          {match.missingSkills.map((s) => (
                            <span key={s} className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-neutral-text-secondary)]">
                    {opp.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {opp.location}
                      </span>
                    )}
                    {opp.isRemote && (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-600">
                        <Globe className="h-3 w-3" />
                        Remote
                      </span>
                    )}
                    {formatSalary(opp) && (
                      <span className="inline-flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatSalary(opp)}
                      </span>
                    )}
                    {opp.applyDeadline && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {opp.applyDeadline.toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {opp.requiredSkills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {opp.requiredSkills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary-emerald)]">
                          {skill}
                        </span>
                      ))}
                      {opp.requiredSkills.length > 4 && (
                        <span className="rounded-full bg-[var(--color-neutral-surface-alt)] px-2 py-0.5 text-xs text-[var(--color-neutral-text-secondary)]">
                          +{opp.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <a href={opp.link} target="_blank" rel="noopener noreferrer" className="btn-green px-4 py-2 rounded-md text-sm font-semibold">
                      Apply
                    </a>
                    {oppStatus === 'saved' ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-primary-emerald)] bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-emerald)]">
                        <Bookmark className="h-3 w-3" /> Saved
                      </span>
                    ) : oppStatus === 'dismissed' ? (
                      <span className="rounded-md border border-[var(--color-neutral-border)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-text-tertiary)]">
                        Dismissed
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSave(opp.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--color-neutral-border)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]"
                        >
                          <Bookmark className="h-3 w-3" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismiss(opp.id)}
                          className="rounded-md border border-[var(--color-neutral-border)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}