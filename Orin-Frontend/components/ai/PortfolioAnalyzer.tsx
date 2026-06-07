'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import {
  Trophy,
  Star,
  TrendingUp,
  Target,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';

interface ScoreBreakdown {
  criteria: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface PortfolioScore {
  overall: number;
  breakdown: ScoreBreakdown[];
  strengths: string[];
  improvements: string[];
  thinking: string;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? 'var(--color-bloom)' : score >= 60 ? 'var(--color-ember)' : 'var(--color-pulse)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-dim)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>/100</span>
      </div>
    </div>
  );
}

export function PortfolioAnalyzer() {
  const [score, setScore] = useState<PortfolioScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);

  const fetchScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.ai.score();
      // Parse the score response
      const scoreNum = parseInt(data.score, 10) || 0;
      const thinking = data.thinking || '';
      
      // Extract breakdown from thinking text
      const breakdown: ScoreBreakdown[] = [];
      const lines = thinking.split('\n');
      let currentCriteria = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^[\d\.]+\s*\/\s*20/i) || trimmed.match(/^score[:\s]/i)) {
          // Try to extract criteria and score
          const match = trimmed.match(/(.+?)[\s:]+(\d+)\s*\/?\s*(\d+)?/i);
          if (match) {
            breakdown.push({
              criteria: match[1].replace(/[*#-]/g, '').trim(),
              score: parseInt(match[2], 10),
              maxScore: parseInt(match[3] || '20', 10),
              feedback: '',
            });
          }
        }
      }

      // If we couldn't parse breakdown, create placeholder
      if (breakdown.length === 0) {
        breakdown.push(
          { criteria: 'Proof Diversity', score: Math.min(20, Math.round(scoreNum * 0.2)), maxScore: 20, feedback: ' variety of proof types' },
          { criteria: 'Skill Coverage', score: Math.min(20, Math.round(scoreNum * 0.2)), maxScore: 20, feedback: ' breadth of skills' },
          { criteria: 'Verification Status', score: Math.min(20, Math.round(scoreNum * 0.2)), maxScore: 20, feedback: ' verified proofs' },
          { criteria: 'Profile Completeness', score: Math.min(20, Math.round(scoreNum * 0.2)), maxScore: 20, feedback: ' complete profile' },
          { criteria: 'Activity & Recency', score: Math.min(20, Math.round(scoreNum * 0.2)), maxScore: 20, feedback: ' recent activity' },
        );
      }

      setScore({
        overall: scoreNum,
        breakdown,
        strengths: extractList(thinking, 'strength'),
        improvements: extractList(thinking, 'improvement'),
        thinking,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchScore(); }, [fetchScore]);

  if (loading) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--color-ember)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Portfolio Score</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>AI is analyzing your portfolio...</p>
          </div>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-bloom)' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-ember)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Scoring Unavailable</h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{error}</p>
        <button onClick={fetchScore} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-bloom)' }}>
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  if (!score) return null;

  return (
    <div className="card-premium p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <Trophy className="w-5 h-5" style={{ color: 'var(--color-ember)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Portfolio Score</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>AI-powered analysis</p>
          </div>
        </div>
        <button
          onClick={() => setShowThinking(!showThinking)}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            backgroundColor: showThinking ? 'var(--color-primary-soft)' : 'var(--color-surface-dim)',
            color: showThinking ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
          }}
        >
          {showThinking ? 'Hide' : 'Show'} Thinking
        </button>
      </div>

      {/* Score Ring */}
      <div className="flex flex-col items-center py-4">
        <ScoreRing score={score.overall} size={100} />
        <p className="text-xs mt-3 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          {score.overall >= 80 ? 'Excellent portfolio!' : score.overall >= 60 ? 'Good progress!' : 'Keep building!'}
        </p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5">
        {score.breakdown.map((item) => (
          <div key={item.criteria}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--color-ink)' }}>{item.criteria}</span>
              <span className="text-[10px] font-bold" style={{ color: item.score >= item.maxScore * 0.8 ? 'var(--color-bloom)' : 'var(--color-ember)' }}>
                {item.score}/{item.maxScore}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(item.score / item.maxScore) * 100}%`,
                  backgroundColor: item.score >= item.maxScore * 0.8 ? 'var(--color-bloom)' : 'var(--color-ember)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-2 gap-3">
        {score.strengths.length > 0 && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--color-bloom)' }} />
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-bloom)' }}>Strengths</span>
            </div>
            <ul className="space-y-1">
              {score.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {score.improvements.length > 0 && (
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-ember)10' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3 h-3" style={{ color: 'var(--color-ember)' }} />
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-ember)' }}>Improve</span>
            </div>
            <ul className="space-y-1">
              {score.improvements.slice(0, 3).map((s, i) => (
                <li key={i} className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Thinking (collapsible) */}
      {showThinking && score.thinking && (
        <div className="p-3 rounded-xl text-[11px] leading-relaxed max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-tertiary)' }}>
          {score.thinking}
        </div>
      )}

      {/* Action */}
      <button
        onClick={fetchScore}
        className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Re-analyze Portfolio
      </button>
    </div>
  );
}

function extractList(text: string, keyword: string): string[] {
  const results: string[] = [];
  const lines = text.split('\n');
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.includes(keyword)) {
      inSection = true;
      continue;
    }
    if (inSection && (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•'))) {
      const item = line.replace(/^[\s-*•]+/, '').trim();
      if (item.length > 5) results.push(item);
    }
    if (inSection && trimmed === '') {
      if (results.length > 0) break;
    }
  }

  return results.slice(0, 3);
}
