'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Wrench,
  Search,
  Globe,
  BarChart3,
  Shield,
  Database,
  Code,
  Lightbulb,
  Target,
  BookOpen,
} from 'lucide-react';

export interface ToolStep {
  name: string;
  description?: string;
  status: 'running' | 'success' | 'error';
  durationMs?: number;
  args?: Record<string, unknown>;
  result?: { success: boolean; data?: unknown; error?: string };
  step?: number;
}

const TOOL_ICONS: Record<string, typeof Wrench> = {
  verify_github_repo: Code,
  verify_github_user: Code,
  verify_certificate: CheckCircle2,
  verify_kaggle: Code,
  verify_linkedin: Code,
  web_search: Search,
  fetch_webpage: Globe,
  analyze_code: Code,
  extract_skills: Lightbulb,
  analyze_portfolio: BarChart3,
  check_url_safety: Shield,
  fetch_user_profile: Database,
  fetch_user_proofs: Database,
  fetch_opportunities: Target,
  get_user_portfolio_summary: BarChart3,
  find_learning_resources: BookOpen,
  calculate_skill_match: Target,
  detect_language: Code,
  generate_embeddings: Database,
  save_conversation: Database,
  fetch_conversation_history: Database,
};

const TOOL_LABELS: Record<string, string> = {
  verify_github_repo: 'Verifying GitHub repo',
  verify_github_user: 'Checking GitHub profile',
  verify_certificate: 'Validating certificate',
  verify_kaggle: 'Checking Kaggle',
  verify_linkedin: 'Verifying LinkedIn',
  web_search: 'Searching the web',
  fetch_webpage: 'Fetching webpage',
  analyze_code: 'Analyzing code',
  extract_skills: 'Extracting skills',
  analyze_portfolio: 'Analyzing portfolio',
  check_url_safety: 'Checking URL safety',
  fetch_user_profile: 'Loading profile',
  fetch_user_proofs: 'Loading proofs',
  fetch_opportunities: 'Finding opportunities',
  get_user_portfolio_summary: 'Loading portfolio summary',
  find_learning_resources: 'Finding resources',
  calculate_skill_match: 'Calculating match',
  detect_language: 'Detecting language',
  generate_embeddings: 'Generating embeddings',
  save_conversation: 'Saving conversation',
  fetch_conversation_history: 'Loading history',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function StepIndicator({ steps, currentStep }: { steps: ToolStep[]; currentStep?: number }) {
  const [expanded, setExpanded] = useState(true);
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.status !== 'running').length;
  const allDone = steps.every(s => s.status !== 'running');
  const totalDuration = steps.reduce((acc, s) => acc + (s.durationMs || 0), 0);

  if (steps.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden my-3 transition-all duration-300"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.02]"
      >
        <div className="flex items-center gap-2 flex-1">
          {allDone ? (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          ) : (
            <Loader2
              className="w-5 h-5 animate-spin"
              style={{ color: 'var(--color-pulse)' }}
            />
          )}

          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
          >
            {allDone
              ? `${completedSteps} step${completedSteps !== 1 ? 's' : ''} completed`
              : `Step ${completedSteps + 1} of ${totalSteps}...`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {totalDuration > 0 && (
            <span
              className="text-[10px] opacity-40 flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(totalDuration)}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-30" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-30" />
          )}
        </div>
      </button>

      {/* Progress bar */}
      {!allDone && (
        <div className="px-4 pb-2">
          <div
            className="h-0.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-dim)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedSteps / totalSteps) * 100}%`,
                backgroundColor: 'var(--color-bloom)',
              }}
            />
          </div>
        </div>
      )}

      {/* Steps list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5">
          {steps.map((step, i) => {
            const Icon = TOOL_ICONS[step.name] || Wrench;
            const label = TOOL_LABELS[step.name] || step.name;
            const isRunning = step.status === 'running';
            const isSuccess = step.status === 'success';
            const isError = step.status === 'error';

            return (
              <div
                key={`${step.name}-${i}`}
                className="flex items-center gap-2.5 py-1.5 rounded-lg px-2 transition-all duration-200"
                style={{
                  backgroundColor: isRunning ? 'var(--color-surface-dim)' : 'transparent',
                  opacity: isRunning ? 1 : 0.7,
                }}
              >
                {/* Status icon */}
                {isRunning ? (
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin flex-shrink-0"
                    style={{ color: 'var(--color-pulse)' }}
                  />
                ) : isSuccess ? (
                  <CheckCircle2
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: 'var(--color-bloom)' }}
                  />
                ) : (
                  <XCircle
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: 'var(--color-pulse)' }}
                  />
                )}

                {/* Tool icon */}
                <Icon
                  className="w-3.5 h-3.5 flex-shrink-0 opacity-50"
                  style={{ color: 'var(--color-ink)' }}
                />

                {/* Label */}
                <span
                  className="text-xs flex-1"
                  style={{
                    color: 'var(--color-ink)',
                    fontFamily: 'var(--font-body)',
                    textDecoration: isRunning ? 'none' : 'none',
                  }}
                >
                  {label}
                </span>

                {/* Duration */}
                {step.durationMs !== undefined && (
                  <span
                    className="text-[10px] opacity-40"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {formatDuration(step.durationMs)}
                  </span>
                )}

                {/* Error */}
                {isError && step.result?.error && (
                  <span
                    className="text-[10px]"
                    style={{ color: 'var(--color-pulse)', fontFamily: 'var(--font-mono)' }}
                  >
                    failed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
