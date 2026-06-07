'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, type SkillAnalysis } from '@/lib/api-client';
import {
  BarChart3,
  TrendingUp,
  Target,
  Lightbulb,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

interface SkillInsightsProps {
  targetRole?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Frontend': 'var(--color-bloom)',
  'Backend': 'var(--color-pulse)',
  'Data Science': 'var(--color-ember)',
  'DevOps': 'var(--color-spark)',
  'Mobile': 'var(--color-bloom)',
  'General': 'var(--color-mist)',
};

export function SkillInsights({ targetRole }: SkillInsightsProps) {
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState(targetRole || '');
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);

  const fetchAnalysis = useCallback(async (role?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.ai.skills(role);
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalysis(targetRole); }, [fetchAnalysis, targetRole]);

  const handleAnalyze = () => {
    fetchAnalysis(roleInput || undefined);
  };

  if (loading) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>AI Skill Analysis</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Analyzing your portfolio...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-ember)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Skill Analysis Unavailable</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{error}</p>
        <button onClick={() => fetchAnalysis(roleInput || undefined)} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-bloom)' }}>
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const topSkills = analysis.topSkills.slice(0, 8);
  const maxCount = topSkills.length > 0 ? topSkills[0].count : 1;

  return (
    <div className="card-premium p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>AI Skill Analysis</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {analysis.totalSkills} skills across {analysis.uniqueSkills} unique
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowGapAnalysis(!showGapAnalysis)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: showGapAnalysis ? 'var(--color-primary-soft)' : 'var(--color-surface-dim)',
            color: showGapAnalysis ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
          }}
        >
          {showGapAnalysis ? 'Top Skills' : 'Gap Analysis'}
        </button>
      </div>

      {/* Target Role Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="Target role (e.g., Frontend Engineer)"
          className="flex-1 text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-ink)',
          }}
        />
        <button
          onClick={handleAnalyze}
          className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      {!showGapAnalysis ? (
        <div className="space-y-3">
          {/* Skill bars */}
          {topSkills.map((skill) => (
            <div key={skill.skill} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-ink)' }}>{skill.skill}</span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
                  {skill.count} proof{skill.count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max((skill.count / maxCount) * 100, 8)}%`,
                    backgroundColor: 'var(--color-bloom)',
                  }}
                />
              </div>
            </div>
          ))}

          {/* Visual Radar (CSS-only) */}
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Skill Coverage</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {topSkills.slice(0, 8).map((skill, i) => {
                const size = Math.max(40, 64 - i * 3);
                const opacity = Math.max(0.4, 1 - i * 0.08);
                return (
                  <div key={skill.skill} className="flex flex-col items-center gap-1">
                    <div
                      className="rounded-full flex items-center justify-center text-white text-[10px] font-bold transition-all duration-500"
                      style={{
                        width: size,
                        height: size,
                        backgroundColor: `var(--color-bloom)`,
                        opacity,
                      }}
                    >
                      {skill.count}
                    </div>
                    <span className="text-[9px] font-medium text-center leading-tight truncate w-full" style={{ color: 'var(--color-text-tertiary)' }}>
                      {skill.skill}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Skill Gaps */}
          {analysis.skillGaps.length > 0 ? (
            analysis.skillGaps.map((gap) => (
              <div
                key={gap.skill}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-surface-dim)', border: '1px solid var(--color-border)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-ember)15' }}>
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-ember)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{gap.skill}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                    {gap.importance} priority · {gap.category}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
              No skill gaps identified. Your portfolio looks strong!
            </p>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'var(--color-bloom)' }}>Recommendations</span>
              </div>
              <ul className="space-y-1.5">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-[11px] leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <ArrowUpRight className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-bloom)' }} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            {analysis.proofCount} proofs
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            {analysis.verifiedCount} verified
          </span>
        </div>
      </div>
    </div>
  );
}
