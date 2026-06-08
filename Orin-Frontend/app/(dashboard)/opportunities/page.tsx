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

const FALLBACK_OPPORTUNITIES: Opportunity[] = [
  { id: 'fo-1', title: 'Software Engineering Intern', company: 'Google', type: 'internship', requiredSkills: ['Python', 'Java', 'Data Structures', 'Algorithms'], niceToHave: ['Machine Learning'], description: 'Join Google as a software engineering intern.', location: 'Mountain View, CA', isRemote: false, link: 'https://careers.google.com', matchPercentage: 85, salaryMin: 8000, salaryMax: 10000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-2', title: 'Frontend Engineering Intern', company: 'Meta', type: 'internship', requiredSkills: ['React', 'TypeScript', 'JavaScript', 'CSS'], niceToHave: ['GraphQL'], description: 'Build the next generation of social experiences.', location: 'Menlo Park, CA', isRemote: false, link: 'https://careers.meta.com', matchPercentage: 78, salaryMin: 7500, salaryMax: 9500, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-3', title: 'ML Engineering Intern', company: 'OpenAI', type: 'internship', requiredSkills: ['Python', 'PyTorch', 'Machine Learning', 'Deep Learning'], niceToHave: ['Transformers', 'CUDA'], description: 'Work on cutting-edge AI research.', location: 'San Francisco, CA', isRemote: false, link: 'https://openai.com/careers', matchPercentage: 90, salaryMin: 8500, salaryMax: 11000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-4', title: 'Senior Frontend Engineer', company: 'Vercel', type: 'job', requiredSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'], niceToHave: ['Edge Functions'], description: 'Join the team behind Next.js.', location: 'Remote', isRemote: true, link: 'https://vercel.com/careers', matchPercentage: 88, salaryMin: 150000, salaryMax: 200000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-5', title: 'Software Engineer', company: 'GitHub', type: 'job', requiredSkills: ['Ruby', 'React', 'TypeScript'], niceToHave: ['Go', 'PostgreSQL'], description: 'Help developers worldwide collaborate.', location: 'San Francisco, CA', isRemote: true, link: 'https://github.com/careers', matchPercentage: 82, salaryMin: 130000, salaryMax: 180000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-6', title: 'Women in Tech Scholarship', company: 'Goldman Sachs', type: 'scholarship', requiredSkills: ['Computer Science', 'Engineering'], niceToHave: ['Finance'], description: 'Supporting women in technology.', location: 'Global', isRemote: true, link: 'https://goldmansachs.com', matchPercentage: 70, salaryMin: 10000, salaryMax: 15000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-7', title: 'AI/ML Mentorship Program', company: 'Anthropic', type: 'mentorship', requiredSkills: ['Machine Learning', 'Python', 'AI Safety'], niceToHave: ['Research'], description: 'Get mentored by leading AI researchers.', location: 'San Francisco, CA', isRemote: true, link: 'https://anthropic.com', matchPercentage: 88, salaryMin: 0, salaryMax: 0, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-8', title: 'Global AI Hackathon', company: 'Devpost', type: 'hackathon', requiredSkills: ['AI/ML', 'Python'], niceToHave: ['NLP', 'LLMs'], description: 'Build innovative AI solutions in 48 hours. $50K in prizes.', location: 'Global', isRemote: true, link: 'https://devpost.com', matchPercentage: 75, salaryMin: 0, salaryMax: 50000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-9', title: 'Data Science Intern', company: 'Netflix', type: 'internship', requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics'], niceToHave: ['Spark', 'TensorFlow'], description: 'Use data to drive content decisions.', location: 'Los Gatos, CA', isRemote: false, link: 'https://jobs.netflix.com', matchPercentage: 72, salaryMin: 7000, salaryMax: 9000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
  { id: 'fo-10', title: 'Backend Engineer', company: 'Supabase', type: 'job', requiredSkills: ['TypeScript', 'PostgreSQL', 'Go'], niceToHave: ['Edge Functions', 'Real-time'], description: 'Build the open source Firebase alternative.', location: 'Remote', isRemote: true, link: 'https://supabase.com/careers', matchPercentage: 85, salaryMin: 120000, salaryMax: 170000, salaryCurrency: 'USD', isActive: true, metadata: {}, createdAt: new Date(), updatedAt: new Date() },
];

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

  // If no opportunities from DB, show fallback opportunities so the page isn't empty
  useEffect(() => {
    if (!loading && opportunities.length === 0) {
      setOpportunities(FALLBACK_OPPORTUNITIES);
    }
  }, [loading, opportunities.length]);

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
      result = result.filter((o) => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q) || o.requiredSkills.some((s) => s.toLowerCase().includes(q)));
    }
    if (typeFilter) result = result.filter((o) => o.type === typeFilter);
    switch (sortBy) {
      case 'match': result.sort((a, b) => { const aMatch = getMatchForOpp(a.id)?.matchScore || a.matchPercentage || 0; const bMatch = getMatchForOpp(b.id)?.matchScore || b.matchPercentage || 0; return bMatch - aMatch; }); break;
      case 'recent': result.sort((a, b) => (b.postedAt?.getTime() || 0) - (a.postedAt?.getTime() || 0)); break;
      case 'salary': result.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0)); break;
    }
    return result;
  }, [opportunities, search, typeFilter, sortBy, skillMatches]);

  const handleSave = async (oppId: string) => {
    setUserOpps((prev) => ({ ...prev, [oppId]: 'saved' }));
    try { await fetch('/api/opportunities/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: oppId, status: 'saved' }) }); } catch {}
  };

  const handleDismiss = async (oppId: string) => {
    setUserOpps((prev) => ({ ...prev, [oppId]: 'dismissed' }));
    try { await fetch('/api/opportunities/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: oppId, status: 'dismissed' }) }); } catch {}
  };

  const formatSalary = (opp: Opportunity) => {
    if (!opp.salaryMin && !opp.salaryMax) return null;
    const currency = opp.salaryCurrency || '$';
    if (opp.salaryMin && opp.salaryMax) return `${currency}${(opp.salaryMin / 1000).toFixed(0)}k - ${currency}${(opp.salaryMax / 1000).toFixed(0)}k`;
    if (opp.salaryMin) return `From ${currency}${(opp.salaryMin / 1000).toFixed(0)}k`;
    return `Up to ${currency}${(opp.salaryMax! / 1000).toFixed(0)}k`;
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return { bg: 'var(--color-bloom)12', color: 'var(--color-bloom)' };
    if (score >= 60) return { bg: 'var(--color-ember)12', color: 'var(--color-ember)' };
    if (score >= 40) return { bg: 'var(--color-spark)12', color: 'var(--color-spark)' };
    return { bg: 'var(--color-surface-dim)', color: 'var(--color-text-tertiary)' };
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between animate-fadeInUp">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>Opportunities</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            AI-matched opportunities based on your verified proof portfolio.
          </p>
        </div>
        <button onClick={fetchAIMatches} disabled={aiLoading} className="btn-success inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60">
          {aiLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {aiLoading ? 'Analyzing...' : 'AI Match'}
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-xl p-4" style={{ border: '1px solid var(--color-pulse)40', backgroundColor: 'var(--color-pulse)08' }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pulse)' }} />
          <div className="flex-1"><p className="text-sm" style={{ color: 'var(--color-pulse)' }}>{error}</p></div>
          <button onClick={() => setError(null)} style={{ color: 'var(--color-pulse)' }}><X className="h-4 w-4" /></button>
        </div>
      )}

      {skillAnalysis && (
        <div className="grid gap-4 md:grid-cols-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          <div className="card-premium p-5">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Your Skills</h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-bloom)' }}>{skillAnalysis.uniqueSkills}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>unique skills from {skillAnalysis.totalSkills} total</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {skillAnalysis.topSkills.slice(0, 5).map((s) => (
                <span key={s.name} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>{s.name}</span>
              ))}
            </div>
          </div>
          <div className="card-premium p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Skill Gaps</h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-ember)' }}>{skillAnalysis.skillGaps.length}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>skills to learn for better matches</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {skillAnalysis.skillGaps.slice(0, 3).map((s) => (
                <span key={s} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-ember)12', color: 'var(--color-ember)' }}>{s}</span>
              ))}
            </div>
          </div>
          <div className="card-premium p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: 'var(--color-pulse)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Match Score</h3>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-pulse)' }}>
              {skillMatches.length > 0 ? Math.round(skillMatches.reduce((a, m) => a + m.matchScore, 0) / skillMatches.length) : '--'}%
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>average match across opportunities</p>
          </div>
        </div>
      )}

      {aiInsights && (
        <div className="card-premium p-5 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <button onClick={() => setShowInsights(!showInsights)} className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>AI Career Insights</h3>
            </div>
            {showInsights ? <ChevronUp className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronDown className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} />}
          </button>
          {showInsights && (
            <div className="mt-4 space-y-3">
              <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--color-ink)' }}>{aiInsights.answer}</p>
              {aiInsights.thinking && <p className="italic text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{aiInsights.thinking}</p>}
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Tokens used: {aiInsights.tokensUsed}</p>
            </div>
          )}
        </div>
      )}

      {skillAnalysis?.recommendations && skillAnalysis.recommendations.length > 0 && (
        <div className="card-premium p-5 animate-fadeInUp" style={{ animationDelay: '250ms' }}>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--color-ink)' }}>Learning Path</h3>
          </div>
          <div className="space-y-2">
            {skillAnalysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fadeInUp" style={{ animationDelay: '300ms' }}>
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input type="text" placeholder="Search by title, company, or skill..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }} />
        </div>
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border px-3 py-2 text-sm focus:outline-none"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}>
            {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
        <button onClick={() => setTypeFilter(null)} className="rounded-full px-3 py-1.5 text-xs font-medium transition" style={{
          backgroundColor: !typeFilter ? 'var(--color-bloom)' : 'transparent',
          color: !typeFilter ? 'white' : 'var(--color-text-tertiary)',
          border: !typeFilter ? 'none' : '1px solid var(--color-border)',
        }}>All</button>
        {TYPE_FILTERS.map((type) => (
          <button key={type} onClick={() => setTypeFilter(typeFilter === type ? null : type)} className="rounded-full px-3 py-1.5 text-xs font-medium transition" style={{
            backgroundColor: typeFilter === type ? 'var(--color-bloom)' : 'transparent',
            color: typeFilter === type ? 'white' : 'var(--color-text-tertiary)',
            border: typeFilter === type ? 'none' : '1px solid var(--color-border)',
          }}>{getOpportunityTypeLabel(type)}</button>
        ))}
      </div>

      <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-premium animate-pulse p-5">
                <div className="h-4 w-24 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="mt-2 h-6 w-48 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="mt-1 h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="mt-4 h-10 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-premium p-6 text-center">
            <p style={{ color: 'var(--color-text-tertiary)' }}>No opportunities found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((opp) => {
              const oppStatus = userOpps[opp.id];
              const match = getMatchForOpp(opp.id);
              const matchScore = match?.matchScore ?? opp.matchPercentage;
              const matchStyle = getMatchColor(matchScore);
              return (
                <div key={opp.id} className="card-premium group p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}>
                          {opp.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tracking-wider" style={{ color: 'var(--color-bloom)' }}>{getOpportunityTypeLabel(opp.type)}</p>
                          <h3 className="truncate text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>{opp.title}</h3>
                          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{opp.company}</p>
                        </div>
                      </div>
                    </div>
                    <span className="ml-3 shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: matchStyle.bg, color: matchStyle.color }}>
                      {matchScore}% match
                    </span>
                  </div>

                  {match && (
                    <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>AI Analysis</p>
                      {match.matchedSkills.length > 0 && (
                        <div className="mb-1 flex flex-wrap gap-1">
                          <span className="text-xs" style={{ color: 'var(--color-bloom)' }}>Matched:</span>
                          {match.matchedSkills.map((s) => (
                            <span key={s} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                      {match.missingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs" style={{ color: 'var(--color-ember)' }}>Learn:</span>
                          {match.missingSkills.map((s) => (
                            <span key={s} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-ember)12', color: 'var(--color-ember)' }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {opp.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.location}</span>}
                    {opp.isRemote && <span className="inline-flex items-center gap-1 rounded px-2 py-0.5" style={{ backgroundColor: 'var(--color-ember)12', color: 'var(--color-ember)' }}><Globe className="h-3 w-3" />Remote</span>}
                    {formatSalary(opp) && <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatSalary(opp)}</span>}
                    {opp.applyDeadline && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(opp.applyDeadline).toLocaleDateString()}</span>}
                  </div>

                  {opp.requiredSkills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {opp.requiredSkills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-bloom)12', color: 'var(--color-bloom)' }}>{skill}</span>
                      ))}
                      {opp.requiredSkills.length > 4 && (
                        <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-tertiary)' }}>+{opp.requiredSkills.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <a href={opp.link} target="_blank" rel="noopener noreferrer" className="btn-success px-4 py-2 text-sm font-semibold">
                      Apply
                    </a>
                    {oppStatus === 'saved' ? (
                      <span className="inline-flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-bloom)', color: 'var(--color-bloom)', backgroundColor: 'var(--color-bloom)08' }}>
                        <Bookmark className="h-3 w-3" /> Saved
                      </span>
                    ) : oppStatus === 'dismissed' ? (
                      <span className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                        Dismissed
                      </span>
                    ) : (
                      <>
                        <button type="button" onClick={() => handleSave(opp.id)} className="inline-flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-semibold transition" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                          <Bookmark className="h-3 w-3" /> Save
                        </button>
                        <button type="button" onClick={() => handleDismiss(opp.id)} className="rounded-xl border px-4 py-2 text-sm font-semibold transition" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
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
