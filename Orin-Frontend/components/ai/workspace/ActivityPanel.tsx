'use client';

import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Wrench,
  Search,
  Globe,
  Code,
  Brain,
  Zap,
  Database,
  Shield,
  BarChart3,
  Target,
  BookOpen,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'tool_call' | 'reasoning' | 'step' | 'error';
  name: string;
  label: string;
  status: 'running' | 'success' | 'error';
  description?: string;
  durationMs?: number;
  timestamp: Date;
}

interface ActivityPanelProps {
  activities: ActivityItem[];
  isStreaming: boolean;
}

const TOOL_ICONS: Record<string, typeof Wrench> = {
  verify_github_repo: Code, verify_github_user: Code, verify_certificate: CheckCircle2,
  web_search: Search, fetch_webpage: Globe, analyze_code: Code,
  extract_skills: Lightbulb, analyze_portfolio: BarChart3,
  check_url_safety: Shield, fetch_user_profile: Database, fetch_user_proofs: Database,
  fetch_opportunities: Target, get_user_portfolio_summary: BarChart3,
  find_learning_resources: BookOpen, calculate_skill_match: Target,
  detect_language: Code, generate_embeddings: Database, save_conversation: Database,
  classify_visual_intent: Zap, render_visual: BarChart3,
  save_user_goal: Target, track_job_application: Target,
  generate_resume_bullets: Code, search_web_free: Search,
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = TOOL_ICONS[item.name] || Wrench;
  const isRunning = item.status === 'running';
  const isSuccess = item.status === 'success';
  const isError = item.status === 'error';

  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2.5 transition-all duration-200 group"
      style={{
        backgroundColor: isRunning ? 'var(--color-surface-dim)' : 'transparent',
        borderLeft: isRunning ? '2px solid var(--color-pulse)' : '2px solid transparent',
      }}
    >
      {/* Status icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--color-pulse)' }} />
        ) : isSuccess ? (
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} />
        ) : (
          <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 flex-shrink-0 opacity-40" style={{ color: 'var(--color-ink)' }} />
          <span
            className="text-[11px] font-medium truncate"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}
          >
            {item.label}
          </span>
        </div>
        {item.description && (
          <p
            className="text-[10px] mt-0.5 truncate"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Duration */}
      {item.durationMs !== undefined && !isRunning && (
        <span
          className="text-[10px] flex-shrink-0 flex items-center gap-0.5 opacity-30"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <Clock className="w-2.5 h-2.5" />
          {formatDuration(item.durationMs)}
        </span>
      )}

      {/* Error badge */}
      {isError && (
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
        >
          failed
        </span>
      )}
    </div>
  );
}

export default function ActivityPanel({ activities, isStreaming }: ActivityPanelProps) {
  const runningCount = activities.filter(a => a.status === 'running').length;
  const successCount = activities.filter(a => a.status === 'success').length;
  const errorCount = activities.filter(a => a.status === 'error').length;
  const completedCount = successCount + errorCount;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-3 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--color-ember)' }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
          >
            Activity
          </span>
        </div>
        {activities.length > 0 && (
          <div className="flex items-center gap-1.5">
            {runningCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: 'rgba(238, 66, 102, 0.1)',
                  color: 'var(--color-pulse)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {runningCount} running
              </span>
            )}
            {completedCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: 'rgba(11, 171, 119, 0.1)',
                  color: 'var(--color-bloom)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {completedCount} done
              </span>
            )}
          </div>
        )}
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            {isStreaming ? (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-pulse)' }} />
                </div>
                <p className="text-[11px] text-center" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                  Waiting for agent...
                </p>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mb-2 opacity-20" style={{ color: 'var(--color-text-tertiary)' }} />
                <p className="text-[11px] text-center opacity-40" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                  Tool activity will appear here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="py-1">
            {activities.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {activities.length > 0 && (
        <div
          className="flex-shrink-0 px-3 py-2 flex items-center justify-between text-[10px]"
          style={{
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>{activities.length} total</span>
          <span>
            {completedCount > 0 && (
              <>
                {successCount}{' '}
                <span style={{ color: 'var(--color-bloom)' }}>ok</span>
                {errorCount > 0 && (
                  <> · {errorCount} <span style={{ color: '#ef4444' }}>err</span></>
                )}
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
