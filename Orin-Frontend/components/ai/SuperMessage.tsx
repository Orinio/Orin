'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourcesDisplay } from './SourcesDisplay';
import { MessageRating } from './MessageRating';
import StepIndicator, { type ToolStep } from './StepIndicator';

export interface SuperMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  agentName?: string;
  thinking?: string;
  steps?: ToolStep[];
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  artifacts?: Array<{ id: string; type: string; title: string; content: string }>;
  isStreaming?: boolean;
  timestamp: Date;
  tokensUsed?: number;
  durationMs?: number;
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

function StreamingText({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
  }, [content]);

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
          style={{
            backgroundColor: 'var(--color-ink)',
            opacity: showCursor ? 0.6 : 0,
            transition: 'opacity 0.1s',
          }}
        />
      )}
    </span>
  );
}

export default function SuperMessage({ message }: { message: SuperMessageData }) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState<Record<string, boolean>>({});

  const isUser = message.role === 'user';
  const agent = AGENT_ACCENTS[message.agentId || 'chat'] || AGENT_ACCENTS.chat;
  const hasSteps = message.steps && message.steps.length > 0;
  const isStreaming = message.isStreaming;

  return (
    <div className="group" style={{ animation: 'fadeInUp 0.25s ease-out' }}>
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex gap-3">
          {/* Avatar */}
          {!isUser && (
            <div
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold mt-0.5 select-none"
              style={{
                backgroundColor: agent.color,
                color: 'white',
                fontFamily: 'var(--font-mono)',
              }}
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
                  style={{
                    color: agent.color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {agent.label}
                </span>
                {isStreaming && !hasSteps && (
                  <span className="flex items-center gap-0.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full animate-pulse"
                        style={{
                          backgroundColor: agent.color,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </span>
                )}
                {message.durationMs && !isStreaming && (
                  <span
                    className="text-[10px] opacity-30"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {(message.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
            )}

            {/* User message */}
            {isUser ? (
              <div
                className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-md text-sm leading-relaxed max-w-[85%]"
                style={{
                  backgroundColor: 'var(--color-ink)',
                  color: 'var(--color-paper)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {message.content}
              </div>
            ) : (
              <>
                {/* Tool steps visualization */}
                {hasSteps && (
                  <StepIndicator steps={message.steps!} />
                )}

                {/* Main content */}
                <div
                  className="text-sm leading-[1.75] mt-1"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}
                >
                  {isStreaming && !message.content ? (
                    <div className="flex items-center gap-2 py-1" style={{ color: 'var(--color-mist)' }}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Processing...</span>
                    </div>
                  ) : isStreaming ? (
                    <StreamingText content={message.content} />
                  ) : message.content ? (
                    <MarkdownRenderer content={message.content} />
                  ) : null}
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3">
                    <SourcesDisplay sources={message.sources} />
                  </div>
                )}

                {/* Artifacts */}
                {message.artifacts && message.artifacts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.artifacts.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                        }}
                      >
                        <button
                          onClick={() => setArtifactsOpen(p => ({ ...p, [a.id]: !p[a.id] }))}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {artifactsOpen[a.id] ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          {a.title}
                          <span className="ml-auto opacity-30 text-[10px]">{a.type}</span>
                        </button>
                        {artifactsOpen[a.id] && (
                          <div className="px-3 pb-3">
                            <pre
                              className="text-xs p-3 rounded-lg overflow-x-auto"
                              style={{
                                backgroundColor: 'var(--color-surface-dim)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {a.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Thinking (collapsible) */}
                {message.thinking && !isStreaming && (
                  <div className="mt-3">
                    <button
                      onClick={() => setThinkingOpen(!thinkingOpen)}
                      className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                      style={{ color: 'var(--color-mist)', fontFamily: 'var(--font-mono)' }}
                    >
                      {thinkingOpen ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Reasoning
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

                {/* Rating + tokens */}
                {!isStreaming && message.content && (
                  <div className="mt-3 flex items-center gap-3">
                    <MessageRating messageId={message.id} />
                    {message.tokensUsed && (
                      <span className="text-[10px] opacity-30" style={{ fontFamily: 'var(--font-mono)' }}>
                        {message.tokensUsed} tokens
                      </span>
                    )}
                  </div>
                )}
              </>
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
