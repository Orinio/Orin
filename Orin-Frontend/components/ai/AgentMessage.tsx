'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, CheckCircle2, AlertCircle, Loader2, Wrench } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourcesDisplay } from './SourcesDisplay';
import { MessageRating } from './MessageRating';

export interface ToolCallInfo {
  name: string;
  arguments?: Record<string, unknown>;
  result?: { success: boolean; data?: unknown; error?: string };
}

export interface AgentMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  agentName?: string;
  thinking?: string;
  toolCalls?: ToolCallInfo[];
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  artifacts?: Array<{ id: string; type: string; title: string; content: string }>;
  isStreaming?: boolean;
  timestamp: Date;
  tokensUsed?: number;
}

const AGENT_COLORS: Record<string, string> = {
  chat: 'var(--color-bloom)',
  coach: 'var(--color-ember)',
  skillAnalyst: 'var(--color-spark)',
  opportunityMatcher: 'var(--color-pulse)',
  learningPathAdvisor: '#6366f1',
  portfolioScorer: 'var(--color-bloom)',
  verifier: '#8b5cf6',
  safetyGuard: '#ef4444',
};

const AGENT_LABELS: Record<string, string> = {
  chat: 'Orin',
  coach: 'Coach',
  skillAnalyst: 'Analyst',
  opportunityMatcher: 'Matcher',
  learningPathAdvisor: 'Advisor',
  portfolioScorer: 'Scorer',
  verifier: 'Verifier',
  safetyGuard: 'Safety',
};

export default function AgentMessage({ message }: { message: AgentMessageData }) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const isUser = message.role === 'user';
  const agentColor = AGENT_COLORS[message.agentId || 'chat'] || 'var(--color-bloom)';
  const agentLabel = AGENT_LABELS[message.agentId || 'chat'] || 'Orin';

  return (
    <div className="group" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <div className={`max-w-3xl mx-auto px-4 py-5 ${isUser ? '' : ''}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          {!isUser && (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold mt-0.5"
              style={{
                backgroundColor: agentColor,
                color: 'white',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {agentLabel.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Agent label */}
            {!isUser && (
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{
                    color: agentColor,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                  }}
                >
                  {agentLabel}
                </span>
                {message.isStreaming && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agentColor }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agentColor, animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agentColor, animationDelay: '0.4s' }} />
                  </span>
                )}
              </div>
            )}

            {/* Main content */}
            {isUser ? (
              <div
                className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-md text-sm leading-relaxed"
                style={{
                  backgroundColor: 'var(--color-ink)',
                  color: 'var(--color-paper)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {message.content}
              </div>
            ) : (
              <div className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}>
                {message.isStreaming && !message.content ? (
                  <div className="flex items-center gap-2 py-1" style={{ color: 'var(--color-mist)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <MarkdownRenderer content={message.content} />
                )}
              </div>
            )}

            {/* Tool calls */}
            {message.toolCalls && message.toolCalls.length > 0 && !isUser && (
              <div className="mt-3">
                <button
                  onClick={() => setToolsOpen(!toolsOpen)}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-mist)', fontFamily: 'var(--font-mono)' }}
                >
                  <Wrench className="w-3 h-3" />
                  {message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''} used
                  {toolsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {toolsOpen && (
                  <div className="mt-2 space-y-1.5">
                    {message.toolCalls.map((tc, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{
                          backgroundColor: 'var(--color-surface-dim)',
                          border: '1px solid var(--color-border)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {tc.result?.success === true ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                        ) : tc.result?.success === false ? (
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-pulse)' }} />
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 animate-spin" style={{ color: 'var(--color-mist)' }} />
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{tc.name}</span>
                          {tc.result?.error && (
                            <span className="ml-2" style={{ color: 'var(--color-pulse)' }}>{tc.result.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && !isUser && (
              <div className="mt-3">
                <SourcesDisplay sources={message.sources} />
              </div>
            )}

            {/* Artifacts */}
            {message.artifacts && message.artifacts.length > 0 && !isUser && (
              <div className="mt-3 space-y-2">
                {message.artifacts.map((a) => (
                  <details
                    key={a.id}
                    className="group/artifact rounded-xl overflow-hidden"
                    style={{
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <summary
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs font-medium select-none"
                      style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
                    >
                      <ChevronRight className="w-3 h-3 transition-transform group-open/artifact:rotate-90" />
                      {a.title}
                      <span className="ml-auto opacity-40 text-[10px]">{a.type}</span>
                    </summary>
                    <div className="px-3 pb-3">
                      <pre
                        className="text-xs p-3 rounded-lg overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--color-surface-dim)',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        {a.content}
                      </pre>
                    </div>
                  </details>
                ))}
              </div>
            )}

            {/* Thinking (collapsible) */}
            {message.thinking && !isUser && (
              <div className="mt-3">
                <button
                  onClick={() => setThinkingOpen(!thinkingOpen)}
                  className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                  style={{ color: 'var(--color-mist)', fontFamily: 'var(--font-mono)' }}
                >
                  {thinkingOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Thinking
                </button>
                {thinkingOpen && (
                  <div
                    className="mt-2 px-3 py-2.5 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"
                    style={{
                      backgroundColor: 'var(--color-surface-dim)',
                      color: 'var(--color-mist)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}
                  >
                    {message.thinking}
                  </div>
                )}
              </div>
            )}

            {/* Rating + metadata */}
            {!isUser && !message.isStreaming && message.content && (
              <div className="mt-3 flex items-center gap-3">
                <MessageRating messageId={message.id} />
                {message.tokensUsed && (
                  <span className="text-[10px] opacity-30" style={{ fontFamily: 'var(--font-mono)' }}>
                    {message.tokensUsed} tokens
                  </span>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          {isUser && (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold mt-0.5"
              style={{
                backgroundColor: 'var(--color-ink)',
                color: 'var(--color-paper)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              U
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
