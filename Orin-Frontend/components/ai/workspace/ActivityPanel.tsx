'use client';

import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronRight,
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
  args?: Record<string, unknown>;
  result?: { success: boolean; data?: unknown; error?: string };
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

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

function truncateJson(obj: unknown, maxLen = 200): string {
  const str = JSON.stringify(obj, null, 2);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/**
 * High-level progress timeline shown during streaming before tools run.
 * Matches Claude/ChatGPT UX: "✓ Analyzing request", "✓ Reading context", etc.
 */
function ProgressTimeline() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing request',
    'Reading context',
    'Planning solution',
    'Generating answer',
  ];

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      if (i > 0) {
        timers.push(setTimeout(() => setCurrentStep(i), i * 1500));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full max-w-[200px] space-y-2">
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#10b981' }} />
            ) : isCurrent ? (
              <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: '#c96442' }} />
            ) : (
              <div className="w-3 h-3 rounded-full border flex-shrink-0" style={{ borderColor: '#e5e0d6' }} />
            )}
            <span
              className="text-[11px]"
              style={{
                color: isComplete ? '#10b981' : isCurrent ? '#c96442' : '#b0aaa0',
                fontFamily: 'var(--font-body)',
                opacity: isComplete ? 0.7 : 1,
              }}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const [expanded, setExpanded] = useState(false);
  const [liveElapsed, setLiveElapsed] = useState(0);
  const Icon = TOOL_ICONS[item.name] || Wrench;
  const isRunning = item.status === 'running';
  const isSuccess = item.status === 'success';
  const isError = item.status === 'error';
  const hasDetails = item.args || item.result;
  const startTimeRef = useRef<number>(item.timestamp.getTime());

  // Live elapsed timer for running items
  useEffect(() => {
    if (!isRunning) return;
    startTimeRef.current = item.timestamp.getTime();
    const interval = setInterval(() => {
      setLiveElapsed(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, item.timestamp]);

  return (
    <div
      className="transition-all duration-200 group"
      style={{
        backgroundColor: isRunning ? 'rgba(201,100,66,0.04)' : 'transparent',
        borderLeft: isRunning ? '2px solid #c96442' : '2px solid transparent',
      }}
    >
      {/* Main row */}
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${hasDetails ? 'hover:bg-black/[0.02] cursor-pointer' : 'cursor-default'}`}
      >
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#c96442' }} />
          ) : isSuccess ? (
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
          ) : (
            <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="w-3 h-3 flex-shrink-0 opacity-40" style={{ color: '#3d3a35' }} />
            <span
              className="text-[11px] font-medium truncate"
              style={{ color: '#3d3a35', fontFamily: 'var(--font-body)' }}
            >
              {item.label}
            </span>
          </div>
          {item.description && (
            <p
              className="text-[10px] mt-0.5 truncate"
              style={{ color: '#8a8580', fontFamily: 'var(--font-body)' }}
            >
              {item.description}
            </p>
          )}
        </div>

        {/* Duration / Live timer */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isRunning ? (
            <span
              className="text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: 'rgba(201,100,66,0.1)',
                color: '#c96442',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <Clock className="w-2.5 h-2.5" />
              {formatElapsed(liveElapsed)}
            </span>
          ) : item.durationMs !== undefined ? (
            <span
              className="text-[10px] flex items-center gap-0.5 opacity-30"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(item.durationMs)}
            </span>
          ) : null}

          {/* Error badge */}
          {isError && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
            >
              failed
            </span>
          )}

          {/* Expand chevron */}
          {hasDetails && (
            expanded
              ? <ChevronDown className="w-3 h-3 opacity-30" />
              : <ChevronRight className="w-3 h-3 opacity-30" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div
          className="px-3 pb-3 ml-6 space-y-2"
          style={{ borderTop: '1px solid #e5e0d6' }}
        >
          {item.args && Object.keys(item.args).length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#b0aaa0' }}>
                Args
              </span>
              <pre
                className="text-[10px] p-2 rounded-lg overflow-x-auto max-h-32 overflow-y-auto"
                style={{ backgroundColor: '#f0ece3', fontFamily: 'var(--font-mono)', color: '#5b5950' }}
              >
                {truncateJson(item.args, 500)}
              </pre>
            </div>
          )}
          {item.result && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#b0aaa0' }}>
                Result
              </span>
              <pre
                className="text-[10px] p-2 rounded-lg overflow-x-auto max-h-32 overflow-y-auto"
                style={{
                  backgroundColor: item.result.success ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  fontFamily: 'var(--font-mono)',
                  color: '#5b5950',
                }}
              >
                {truncateJson(item.result.data || item.result.error, 500)}
              </pre>
            </div>
          )}
        </div>
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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#faf9f5' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-3 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #e5e0d6' }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" style={{ color: '#c96442' }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#3d3a35', fontFamily: 'var(--font-mono)' }}
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
                  backgroundColor: 'rgba(201,100,66,0.1)',
                  color: '#c96442',
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
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
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
              <ProgressTimeline />
            ) : (
              <>
                <Zap className="w-5 h-5 mb-2 opacity-20" style={{ color: '#b0aaa0' }} />
                <p className="text-[11px] text-center opacity-40" style={{ color: '#b0aaa0', fontFamily: 'var(--font-body)' }}>
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
            borderTop: '1px solid #e5e0d6',
            color: '#b0aaa0',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>{activities.length} total</span>
          <span>
            {completedCount > 0 && (
              <>
                {successCount}{' '}
                <span style={{ color: '#10b981' }}>ok</span>
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
