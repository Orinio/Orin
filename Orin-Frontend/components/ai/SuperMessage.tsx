'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
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
  Brain,
  Zap,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourcesDisplay } from './SourcesDisplay';
import { MessageRating } from './MessageRating';
import { VisualRenderer } from '@/components/visuals/VisualRenderer';

export interface SuperMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  agentName?: string;
  thinking?: string;
  steps?: Array<{
    name: string;
    description?: string;
    status: 'running' | 'success' | 'error';
    durationMs?: number;
    args?: Record<string, unknown>;
    result?: { success: boolean; data?: unknown; error?: string };
    step?: number;
  }>;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  artifacts?: Array<{ id: string; type: string; title: string; content: string }>;
  visualSpecs?: Array<Record<string, any>>;
  followUps?: string[];
  isStreaming?: boolean;
  timestamp: Date;
  tokensUsed?: number;
  durationMs?: number;
  error?: string;
  rating?: 'positive' | 'negative' | 'flagged';
  ratingFeedback?: string;
}

const AGENT_ACCENTS: Record<string, { color: string; label: string; letter: string }> = {
  chat: { color: 'var(--color-bloom)', label: 'Orin', letter: 'O' },
  coach: { color: 'var(--color-ember)', label: 'Coach', letter: 'C' },
  skillAnalyst: { color: '#eab308', label: 'Analyst', letter: 'A' },
  opportunityMatcher: { color: 'var(--color-pulse)', label: 'Matcher', letter: 'M' },
  learningPathAdvisor: { color: '#6366f1', label: 'Advisor', letter: 'L' },
  portfolioScorer: { color: 'var(--color-bloom)', label: 'Scorer', letter: 'S' },
  verifier: { color: '#8b5cf6', label: 'Verifier', letter: 'V' },
  safetyGuard: { color: '#ef4444', label: 'Safety', letter: 'X' },
};

const TOOL_ICONS: Record<string, typeof Wrench> = {
  verify_github_repo: Code, verify_github_user: Code, verify_certificate: CheckCircle2,
  verify_kaggle: Code, verify_linkedin: Code, web_search: Search, fetch_webpage: Globe,
  analyze_code: Code, extract_skills: Lightbulb, analyze_portfolio: BarChart3,
  check_url_safety: Shield, fetch_user_profile: Database, fetch_user_proofs: Database,
  fetch_opportunities: Target, get_user_portfolio_summary: BarChart3,
  find_learning_resources: BookOpen, calculate_skill_match: Target,
  detect_language: Code, generate_embeddings: Database, save_conversation: Database,
  classify_visual_intent: Sparkles, render_visual: BarChart3,
  save_user_goal: Target, track_job_application: Target,
  generate_resume_bullets: Code, search_web_free: Search,
};

const TOOL_LABELS: Record<string, string> = {
  verify_github_repo: 'Verifying GitHub repo', verify_github_user: 'Checking GitHub profile',
  verify_certificate: 'Validating certificate', web_search: 'Searching the web',
  fetch_webpage: 'Fetching webpage', analyze_code: 'Analyzing code',
  extract_skills: 'Extracting skills', analyze_portfolio: 'Analyzing portfolio',
  check_url_safety: 'Checking URL safety', fetch_user_profile: 'Loading profile',
  fetch_user_proofs: 'Loading proofs', fetch_opportunities: 'Finding opportunities',
  get_user_portfolio_summary: 'Loading portfolio summary',
  find_learning_resources: 'Finding resources', calculate_skill_match: 'Calculating match',
  detect_language: 'Detecting language', classify_visual_intent: 'Deciding visual',
  render_visual: 'Building visual', save_user_goal: 'Saving goal',
  track_job_application: 'Tracking application', generate_resume_bullets: 'Generating bullets',
  search_web_free: 'Searching web',
};

function StreamingText({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!content) return;
    const interval = setInterval(() => {
      if (indexRef.current < content.length) {
        const end = Math.min(indexRef.current + 3, content.length);
        setDisplayed(content.substring(0, end));
        indexRef.current = end;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [content]);

  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor(p => !p), 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span>
      {displayed}
      {indexRef.current < content.length && (
        <span
          className="inline-block w-[2px] h-[14px] ml-[1px] align-middle"
          style={{ backgroundColor: 'var(--color-ink)', opacity: showCursor ? 0.6 : 0, transition: 'opacity 0.1s' }}
        />
      )}
    </span>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/* ── Live Activity Feed (shown during streaming) ── */
function LiveActivityFeed({ thinking, steps, content, agent }: {
  thinking?: string;
  steps: SuperMessageData['steps'];
  content: string;
  agent: { color: string };
}) {
  const hasSteps = steps && steps.length > 0;
  const hasContent = content.length > 0;
  const isThinking = !!thinking && !hasSteps && !hasContent;
  const runningStep = steps?.find(s => s.status === 'running');
  const completedCount = steps?.filter(s => s.status !== 'running').length || 0;

  return (
    <div className="space-y-1.5 mt-1">
      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex items-center gap-2 py-1 px-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
          <Brain className="w-3.5 h-3.5 animate-pulse" style={{ color: agent.color }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
            Thinking...
          </span>
          <span className="flex items-center gap-0.5 ml-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: agent.color, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        </div>
      )}

      {/* Tool calls */}
      {hasSteps && steps!.map((step, i) => {
        const Icon = TOOL_ICONS[step.name] || Wrench;
        const label = TOOL_LABELS[step.name] || step.name;
        const isRunning = step.status === 'running';
        const isSuccess = step.status === 'success';
        const isError = step.status === 'error';

        return (
          <div
            key={`${step.name}-${i}`}
            className="flex items-center gap-2 py-1 px-2 rounded-lg transition-all duration-300"
            style={{
              backgroundColor: isRunning ? 'var(--color-surface-dim)' : 'transparent',
              opacity: isRunning ? 1 : 0.6,
            }}
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: 'var(--color-pulse)' }} />
            ) : isSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
            ) : (
              <XCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-pulse)' }} />
            )}
            <Icon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" style={{ color: 'var(--color-ink)' }} />
            <span className="text-xs flex-1" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}>
              {label}
            </span>
            {step.durationMs !== undefined && (
              <span className="text-[10px] opacity-40" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatDuration(step.durationMs)}
              </span>
            )}
            {isError && (
              <span className="text-[10px]" style={{ color: 'var(--color-pulse)', fontFamily: 'var(--font-mono)' }}>
                failed
              </span>
            )}
          </div>
        );
      })}

      {/* Active tool indicator (when steps exist but none running — between tools) */}
      {hasSteps && !runningStep && !hasContent && (
        <div className="flex items-center gap-2 py-1 px-2">
          <Zap className="w-3.5 h-3.5 animate-pulse" style={{ color: agent.color }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Processing results...
          </span>
        </div>
      )}
    </div>
  );
}

export default function SuperMessage({ message, onRate, onRetry }: {
  message: SuperMessageData;
  onRate?: (messageId: string, rating: 'positive' | 'negative' | 'flagged', feedback?: string) => void;
  onRetry?: (messageId: string) => void;
}) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState<Record<string, boolean>>({});

  const isUser = message.role === 'user';
  const agent = AGENT_ACCENTS[message.agentId || 'chat'] || AGENT_ACCENTS.chat;
  const hasSteps = message.steps && message.steps.length > 0;
  const isStreaming = message.isStreaming;
  const showLiveFeed = isStreaming && (!message.content || message.content.length === 0);

  return (
    <div className="group" style={{ animation: 'fadeInUp 0.25s ease-out' }}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-3">
          {/* Avatar */}
          {!isUser && (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold mt-0.5 select-none"
              style={{ backgroundColor: agent.color, color: 'white', fontFamily: 'var(--font-mono)' }}
            >
              {agent.letter}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Agent label */}
            {!isUser && (
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold tracking-widest uppercase"
                  style={{ color: agent.color, fontFamily: 'var(--font-mono)' }}
                >
                  {message.agentName || agent.label}
                </span>
                {isStreaming && (
                  <span className="flex items-center gap-0.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full animate-pulse"
                        style={{ backgroundColor: agent.color, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                )}
                {message.durationMs && !isStreaming && (
                  <span className="text-[10px] opacity-30" style={{ fontFamily: 'var(--font-mono)' }}>
                    {(message.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )}

            {/* User message */}
            {isUser ? (
              <div
                className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-md text-sm leading-relaxed max-w-[85%]"
                style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)', fontFamily: 'var(--font-body)' }}
              >
                {message.content}
              </div>
            ) : (
              <>
                {/* Live activity feed during streaming (before content arrives) */}
                {showLiveFeed && (
                  <LiveActivityFeed
                    thinking={message.thinking}
                    steps={message.steps}
                    content={message.content}
                    agent={agent}
                  />
                )}

                {/* Collapsed step summary (after streaming done) */}
                {!isStreaming && hasSteps && (
                  <StepSummary steps={message.steps!} />
                )}

                {/* Main content */}
                <div
                  className="text-sm leading-[1.75] mt-1"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}
                >
                  {isStreaming && message.content ? (
                    <StreamingText content={message.content} />
                  ) : !isStreaming && message.content ? (
                    <MarkdownRenderer content={message.content} />
                  ) : null}
                </div>

                {/* Thinking toggle */}
                {message.thinking && !isStreaming && (
                  <button
                    onClick={() => setThinkingOpen(!thinkingOpen)}
                    className="flex items-center gap-1.5 mt-2 text-[10px] opacity-40 hover:opacity-70 transition-opacity"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {thinkingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <Brain className="w-3 h-3" />
                    reasoning
                  </button>
                )}
                {thinkingOpen && message.thinking && (
                  <div
                    className="mt-1 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"
                    style={{
                      backgroundColor: 'var(--color-surface-dim)',
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {message.thinking}
                  </div>
                )}

                {/* Error + Retry */}
                {message.error && !isStreaming && (
                  <div
                    className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.15)',
                      color: 'var(--color-pulse)',
                    }}
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{message.error}</span>
                    {onRetry && (
                      <button
                        onClick={() => onRetry(message.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors hover:bg-black/5"
                        style={{ color: 'var(--color-pulse)' }}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry
                      </button>
                    )}
                  </div>
                )}

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3">
                    <SourcesDisplay sources={message.sources} />
                  </div>
                )}

                {/* Visual Specs */}
                {message.visualSpecs && message.visualSpecs.length > 0 && !isStreaming && (
                  <div className="mt-4 space-y-4">
                    {message.visualSpecs.map((spec, i) => (
                      <VisualRenderer key={i} spec={spec as any} />
                    ))}
                  </div>
                )}

                {/* Artifacts */}
                {message.artifacts && message.artifacts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.artifacts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl overflow-hidden"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                      >
                        <button
                          onClick={() => setArtifactsOpen(p => ({ ...p, [a.id]: !p[a.id] }))}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {artifactsOpen[a.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          {a.title}
                          <span className="ml-auto opacity-30 text-[10px]">{a.type}</span>
                        </button>
                        {artifactsOpen[a.id] && (
                          <div className="px-3 pb-3">
                            <pre
                              className="p-3 rounded-lg text-xs overflow-x-auto"
                              style={{ backgroundColor: 'var(--color-surface-dim)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}
                            >
                              {a.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {!isStreaming && message.content && onRate && (
                  <div className="mt-3">
                    <MessageRating
                      messageId={message.id}
                      onRate={onRate}
                    />
                  </div>
                )}

                {/* Suggested Follow-ups */}
                {!isStreaming && message.followUps && message.followUps.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      Suggested
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.followUps.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            // Find the chat input and set the suggestion
                            const input = document.querySelector('[data-chat-input]') as HTMLTextAreaElement;
                            if (input) {
                              input.value = suggestion;
                              input.dispatchEvent(new Event('input', { bubbles: true }));
                              input.focus();
                            }
                          }}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all hover:scale-105"
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'rgba(59, 130, 246, 0.9)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Collapsed Step Summary (post-streaming) ── */
function StepSummary({ steps }: { steps: NonNullable<SuperMessageData['steps']> }) {
  const [expanded, setExpanded] = useState(false);
  if (steps.length === 0) return null;

  const allDone = steps.every(s => s.status !== 'running');
  const totalDuration = steps.reduce((acc, s) => acc + (s.durationMs || 0), 0);

  return (
    <div
      className="rounded-lg overflow-hidden my-2 transition-all duration-200"
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors hover:bg-black/[0.02]"
      >
        {allDone ? (
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} />
        ) : (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--color-pulse)' }} />
        )}
        <span className="font-medium" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>
          {steps.length} tool{steps.length !== 1 ? 's' : ''} used
        </span>
        {totalDuration > 0 && (
          <span className="opacity-30 ml-auto flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            <Clock className="w-2.5 h-2.5" />
            {formatDuration(totalDuration)}
          </span>
        )}
        {expanded ? <ChevronDown className="w-3 h-3 opacity-30" /> : <ChevronRight className="w-3 h-3 opacity-30" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {steps.map((step, i) => {
            const Icon = TOOL_ICONS[step.name] || Wrench;
            const label = TOOL_LABELS[step.name] || step.name;
            return (
              <div key={`${step.name}-${i}`} className="flex items-center gap-2 py-1 text-[11px]" style={{ opacity: 0.6 }}>
                {step.status === 'success' ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                ) : step.status === 'error' ? (
                  <XCircle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-pulse)' }} />
                ) : (
                  <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: 'var(--color-pulse)' }} />
                )}
                <Icon className="w-3 h-3 opacity-40" />
                <span style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
                {step.durationMs !== undefined && (
                  <span className="ml-auto opacity-40" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                    {formatDuration(step.durationMs)}
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
