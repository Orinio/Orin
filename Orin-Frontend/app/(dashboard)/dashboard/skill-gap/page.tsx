'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  importance: 'critical' | 'important' | 'nice_to_have';
  estimatedHours: number;
}

interface ActionTask {
  title: string;
  skill: string;
  hours: number;
  resource: {
    title: string;
    url: string;
    type: string;
    free: boolean;
  };
}

interface ActionPlan {
  week: number;
  focus: string;
  totalHours: number;
  tasks: ActionTask[];
}

interface SkillGapAnalysis {
  targetRole: string;
  readinessScore: number;
  estimatedWeeks: number;
  estimatedTotalHours: number;
  gaps: SkillGap[];
  actionPlan: ActionPlan[];
}

const TARGET_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer',
  'Designer',
  'Product Manager',
];

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: 'var(--color-pulse)',
  important: 'var(--color-ember)',
  nice_to_have: 'var(--color-text-tertiary)',
};

export default function SkillGapPage() {
  const { user: authUser } = useAuth();
  const [targetRole, setTargetRole] = useState('');
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeGaps = async () => {
    if (!targetRole || !supabase || !authUser) return;

    setLoading(true);
    setError(null);

    try {
      // Get user ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      if (!userData) {
        setError('User not found');
        return;
      }

      // Call backend API for skill gap analysis
      const res = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          targetRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze skill gaps');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze skill gaps');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1
          className="text-2xl font-semibold flex items-center gap-3"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
        >
          <Target className="h-6 w-6" style={{ color: 'var(--color-bloom)' }} />
          Skill Gap Engine
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          See what skills you need for your target role and get an actionable 1-2 week plan.
        </p>
      </header>

      {/* Role Selection */}
      <div className="card-premium p-6">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
          Select Target Role
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Choose the role you're targeting to see your skill gaps.
        </p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {TARGET_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setTargetRole(role)}
              className="rounded-xl p-3 text-left text-sm font-medium transition-all"
              style={{
                border: `2px solid ${targetRole === role ? 'var(--color-bloom)' : 'var(--color-border)'}`,
                backgroundColor: targetRole === role ? 'var(--color-bloom)08' : 'transparent',
              }}
            >
              {role}
            </button>
          ))}
        </div>

        <button
          onClick={analyzeGaps}
          disabled={!targetRole || loading}
          className="mt-4 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
            </span>
          ) : (
            'Analyze Skill Gaps'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 text-sm" style={{
          border: '1px solid var(--color-pulse)40',
          backgroundColor: 'var(--color-pulse)08',
          color: 'var(--color-pulse)',
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Readiness Score */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                  Readiness Score
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  for {analysis.targetRole}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold" style={{
                  color: analysis.readinessScore >= 70 ? 'var(--color-bloom)' :
                    analysis.readinessScore >= 40 ? 'var(--color-ember)' : 'var(--color-pulse)',
                }}>
                  {analysis.readinessScore}%
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {analysis.estimatedWeeks} weeks · {analysis.estimatedTotalHours} hours
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: analysis.readinessScore >= 70 ? 'var(--color-bloom)' :
                    analysis.readinessScore >= 40 ? 'var(--color-ember)' : 'var(--color-pulse)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${analysis.readinessScore}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              Skill Gaps ({analysis.gaps.length})
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Skills you need to develop, ranked by importance.
            </p>

            <div className="mt-4 space-y-3">
              {analysis.gaps.map((gap) => (
                <div
                  key={gap.skill}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-surface-dim)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: IMPORTANCE_COLORS[gap.importance] }}
                    />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {gap.skill}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {gap.importance} · {gap.estimatedHours} hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {gap.currentLevel}% → {gap.targetLevel}%
                      </p>
                    </div>
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${gap.currentLevel}%`,
                          backgroundColor: 'var(--color-bloom)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              Action Plan
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Your personalized 1-2 week learning plan.
            </p>

            <div className="mt-4 space-y-4">
              {analysis.actionPlan.map((plan) => (
                <div
                  key={plan.week}
                  className="rounded-xl p-4"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      Week {plan.week}: {plan.focus}
                    </h3>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {plan.totalHours} hours
                    </span>
                  </div>

                  <div className="space-y-2">
                    {plan.tasks.map((task, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                          <div>
                            <p className="text-sm" style={{ color: 'var(--color-ink)' }}>
                              {task.title}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                              {task.skill} · {task.hours} hours
                            </p>
                          </div>
                        </div>
                        <a
                          href={task.resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium"
                          style={{ color: 'var(--color-bloom)' }}
                        >
                          {task.resource.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
