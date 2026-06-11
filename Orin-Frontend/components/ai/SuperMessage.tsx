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
  Copy,
  Check,
  Pencil,
  Share2,
  RotateCcw,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourcesDisplay } from './SourcesDisplay';
import { MessageRating } from './MessageRating';
import { VisualRenderer } from '@/components/visuals/VisualRenderer';
import ThinkingCard from './ThinkingCard';

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
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!content) return;
    // If content arrived all at once (non-streamed fallback), show it instantly
    if (content.length > 500) {
      setDisplayed(content);
      indexRef.current = content.length;
      return;
    }
    const tick = () => {
      if (indexRef.current < content.length) {
        const end = Math.min(indexRef.current + 8, content.length);
        setDisplayed(content.substring(0, end));
        indexRef.current = end;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
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

export default function SuperMessage({ message, onRate, onRetry, onFollowUp, onCopy, onRegenerate, onEdit }: {
  message: SuperMessageData;
  onRate?: (messageId: string, rating: 'positive' | 'negative' | 'flagged', feedback?: string) => void;
  onRetry?: (messageId: string) => void;
  onFollowUp?: (content: string) => void;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
}) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';
  const agent = AGENT_ACCENTS[message.agentId || 'chat'] || AGENT_ACCENTS.chat;
  const hasSteps = message.steps && message.steps.length > 0;
  const isStreaming = message.isStreaming;
  const showLiveFeed = isStreaming && (!message.content || message.content.length === 0);

  return (
    <div className="group" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* User message — warm beige bubble, right-aligned */}
        {isUser ? (
          <div className="flex justify-end">
            <div
              className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-md text-sm leading-[1.65] max-w-[80%]"
              style={{
                backgroundColor: '#e5e0d6',
                color: '#1a1a1a',
                fontFamily: 'var(--font-body)',
              }}
            >
              {message.content}
            </div>
          </div>
        ) : (
          <>
            {/* Assistant message — Claude-style: no avatar, no bubble, text on cream */}
            <div className="max-w-[85%]">
              {/* Agent label — minimal */}
              {!isUser && (
                <div className="flex items-center gap-2 mb-1.5">
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

              {/* Live thinking card during streaming — shows reasoning process */}
              {isStreaming && message.thinking && (
                <div className="mb-2">
                  <ThinkingCard content={message.thinking} isStreaming={isStreaming} />
                </div>
              )}

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

              {/* Main content — serif for editorial feel, on cream background */}
              <div
                className="text-sm leading-[1.65]"
                style={{ color: '#3d3a35', fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {isStreaming && message.content ? (
                  <StreamingText content={message.content} />
                ) : !isStreaming && message.content ? (
                  <MarkdownRenderer content={message.content} />
                ) : null}
              </div>

              {/* Thinking toggle — minimal */}
              {message.thinking && !isStreaming && (
                <button
                  onClick={() => setThinkingOpen(!thinkingOpen)}
                  className="flex items-center gap-1.5 mt-2 text-[10px] opacity-30 hover:opacity-60 transition-opacity"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {thinkingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Brain className="w-3 h-3" />
                  reasoning
                </button>
              )}
              {thinkingOpen && message.thinking && (
                <div
                  className="mt-1 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto"
                  style={{
                    backgroundColor: '#f0ece3',
                    color: '#5b5950',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid #e5e0d6',
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
                    color: '#dc2626',
                  }}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1">{message.error}</span>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(message.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors hover:bg-black/5"
                      style={{ color: '#dc2626' }}
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
                      style={{ border: '1px solid #e5e0d6', backgroundColor: '#faf9f5' }}
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
                            style={{ backgroundColor: '#f0ece3', fontFamily: 'var(--font-mono)', color: '#3d3a35' }}
                          >
                            {a.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Rating — hover-only */}
              {!isStreaming && message.content && onRate && (
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <MessageRating
                    messageId={message.id}
                    onRate={onRate}
                  />
                </div>
              )}

              {/* Message Actions — hover-only */}
              {!isStreaming && message.content && (
                <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Copy */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setCopied(true);
                      onCopy?.(message.content);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1.5 rounded-lg transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
                    title="Copy message"
                    style={{ color: '#8a8580' }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#10b981' }} /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Regenerate (assistant only) */}
                  {!isUser && onRegenerate && (
                    <button
                      onClick={() => onRegenerate(message.id)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
                      title="Regenerate response"
                      style={{ color: '#8a8580' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Edit (user only) */}
                  {isUser && onEdit && (
                    <button
                      onClick={() => {
                        if (editing) {
                          onEdit(message.id, editContent);
                          setEditing(false);
                        } else {
                          setEditContent(message.content);
                          setEditing(true);
                        }
                      }}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
                      title={editing ? 'Save edit' : 'Edit message'}
                      style={{ color: editing ? '#c96442' : '#8a8580' }}
                    >
                      {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Share */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/ai/share', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            content: message.content,
                            role: message.role,
                            agentName: message.agentName || agent.label,
                            thinking: message.thinking,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          const url = `${window.location.origin}${data.shareUrl}`;
                          navigator.clipboard.writeText(url);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      } catch {
                        // Fallback: copy message content directly
                        navigator.clipboard.writeText(message.content);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="p-1.5 rounded-lg transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
                    title="Copy share link"
                    style={{ color: '#8a8580' }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" style={{ color: '#10b981' }} /> : <Share2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Edit mode textarea (user messages) */}
              {editing && isUser && (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#f0ece3',
                      border: '1px solid #e5e0d6',
                      color: '#1a1a1a',
                      fontFamily: 'var(--font-body)',
                      minHeight: '60px',
                    } as React.CSSProperties}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onEdit?.(message.id, editContent);
                        setEditing(false);
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => setEditing(false)}
                      className="text-[11px] px-2.5 py-1 rounded-lg"
                      style={{ color: '#8a8580', border: '1px solid #e5e0d6' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { onEdit?.(message.id, editContent); setEditing(false); }}
                      className="text-[11px] px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: '#c96442', color: 'white' }}
                    >
                      Save & Resend
                    </button>
                  </div>
                </div>
              )}

              {/* Suggested Follow-ups */}
              {!isStreaming && message.followUps && message.followUps.length > 0 && onFollowUp && (
                <div className="mt-4">
                  <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#b0aaa0' }}>
                    Suggested
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {message.followUps.map((fu, i) => (
                      <button
                        key={i}
                        onClick={() => onFollowUp(fu)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          border: '1px solid #e5e0d6',
                          color: '#5b5950',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0ece3'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        {fu}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
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
