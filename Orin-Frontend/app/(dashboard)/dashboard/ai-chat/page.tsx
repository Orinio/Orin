'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  User,
  Sparkles,
  Loader2,
  Trash2,
  Lightbulb,
  Brain,
  Clock,
  Zap,
  Bot,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Square,
  Globe,
  ChevronDown,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  RotateCcw,
  Download,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer';
import { SourcesDisplay, type Source } from '@/components/ai/SourcesDisplay';
import { ArtifactsPanel, type Artifact } from '@/components/ai/ArtifactsPanel';
import { FileUpload, type AttachedFile } from '@/components/ai/FileUpload';
import { MessageRating } from '@/components/ai/MessageRating';

// ============================================================
// Types
// ============================================================

interface ToolCall {
  tool: string;
  args: Record<string, any>;
  success?: boolean;
  data?: any;
  description?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  sources?: Source[];
  artifacts?: Artifact[];
  tokensUsed?: number;
  iterations?: number;
  timestamp: Date;
  isStreaming?: boolean;
}

// ============================================================
// Suggestions (Claude-style clean cards)
// ============================================================

const SUGGESTIONS = [
  { text: 'What skills should I learn next based on market demand?', icon: Zap, category: 'Career' },
  { text: 'Analyze my GitHub profile and suggest improvements', icon: Globe, category: 'Portfolio' },
  { text: 'What certifications would boost my resume the most?', icon: Sparkles, category: 'Learning' },
  { text: 'Help me prepare for technical interviews at FAANG', icon: Brain, category: 'Interview' },
  { text: 'Review my proof cards and suggest new projects', icon: Lightbulb, category: 'Projects' },
  { text: 'How do I stand out to recruiters in my field?', icon: MessageSquare, category: 'Strategy' },
];

// ============================================================
// Main Component
// ============================================================

export default function AIChatPage() {
  return (
    <ErrorBoundary>
      <AIChatContent />
    </ErrorBoundary>
  );
}

function AIChatContent() {
  const { user: authUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState<Record<string, boolean>>({});
  const [agentStatus, setAgentStatus] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Split-pane: artifacts panel
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  // File upload
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Abort controller for stop generation
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Scroll management ──────────────────────────────────
  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [autoScroll]);

  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
    if (nearBottom && !autoScroll) setAutoScroll(true);
  }, [isNearBottom, autoScroll]);

  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(), 50);
    return () => clearTimeout(t);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(t);
    }
  }, [loading, scrollToBottom]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  // ── File handling ──────────────────────────────────────
  const handleFilesAdd = useCallback((newFiles: File[]) => {
    const mapped: AttachedFile[] = newFiles.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f,
      name: f.name,
      type: f.type,
      size: f.size,
      status: 'ready' as const,
    }));
    setAttachedFiles(prev => [...prev, ...mapped]);
  }, []);

  const handleFileRemove = useCallback((id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // ── Send message ───────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setAgentStatus('Thinking...');
    setAutoScroll(true);
    setShowScrollButton(false);
    setAttachedFiles([]);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolCalls: [],
      sources: [],
      artifacts: [],
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ message: text.trim(), history }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            try {
              const parsed = JSON.parse(dataStr);
              handleStreamEvent(parsed, assistantId);
            } catch { /* skip invalid JSON */ }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: m.content || 'Generation stopped.', isStreaming: false }
            : m
        ));
      } else {
        console.error('Chat error:', error);
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
            : m
        ));
      }
    } finally {
      setLoading(false);
      setAgentStatus('');
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
    setAgentStatus('');
  };

  // ── Stream event handling ───────────────────────────────
  const handleStreamEvent = (data: any, assistantId: string) => {
    // Tool started
    if (data.tool && data.args && data.success === undefined) {
      setAgentStatus(`Using ${data.tool}...`);
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        return { ...m, toolCalls: [...(m.toolCalls || []), { tool: data.tool, args: data.args, description: data.description }] };
      }));
      return;
    }

    // Tool completed
    if (data.tool && data.success !== undefined) {
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        return {
          ...m,
          toolCalls: (m.toolCalls || []).map(tc =>
            tc.tool === data.tool && tc.success === undefined
              ? { ...tc, success: data.success, data: data.data, error: data.error }
              : tc
          ),
        };
      }));
      setAgentStatus(data.success ? `${data.tool} complete` : `${data.tool} failed`);
      return;
    }

    // Sources (web search results)
    if (data.sources && Array.isArray(data.sources)) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, sources: [...(m.sources || []), ...data.sources] } : m
      ));
      return;
    }

    // Artifacts
    if (data.artifact) {
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        return { ...m, artifacts: [...(m.artifacts || []), data.artifact] };
      }));
      setShowArtifacts(true);
      return;
    }

    // Thinking
    if (data.thinking) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, thinking: data.thinking } : m
      ));
      setAgentStatus('Thinking...');
      return;
    }

    // Streaming content
    if (data.content && !data.answer) {
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        return { ...m, content: m.content + data.content };
      }));
      setAgentStatus('Generating...');
      return;
    }

    // Final answer
    if (data.answer && data.agentId) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? {
              ...m,
              content: data.answer || m.content,
              thinking: data.thinking || m.thinking,
              toolCalls: data.toolCalls || m.toolCalls,
              sources: data.sources || m.sources,
              tokensUsed: data.tokensUsed,
              iterations: data.iterations,
              isStreaming: false,
            }
          : m
      ));
      setAgentStatus('');
      return;
    }

    // Error
    if (data.message && !data.tool) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: data.message || 'An error occurred', isStreaming: false }
          : m
      ));
      setAgentStatus('');
    }
  };

  // ── UI handlers ────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowThinking({});
    setExpandedTools({});
    setAgentStatus('');
    setShowArtifacts(false);
    setActiveArtifactId(null);
  };

  const toggleThinking = (id: string) => {
    setShowThinking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleToolExpand = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToBottomManual = () => {
    scrollToBottom(true);
    setAutoScroll(true);
    setShowScrollButton(false);
  };

  const selectArtifact = (id: string) => {
    setActiveArtifactId(id);
    setShowArtifacts(true);
  };

  // ── Tool icon helper ───────────────────────────────────
  const getToolIcon = (toolName: string) => {
    if (toolName.includes('verify') || toolName.includes('check')) return CheckCircle2;
    if (toolName.includes('extract') || toolName.includes('analyze')) return Brain;
    if (toolName.includes('search') || toolName.includes('fetch')) return Globe;
    return Wrench;
  };

  // ── Render ─────────────────────────────────────────────
  const hasArtifacts = messages.some(m => m.artifacts && m.artifacts.length > 0);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)]">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-3 sm:mb-4 gap-2 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary-soft)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--color-ink)' }}>
              Orin AI
            </h1>
            <p className="text-[10px] sm:text-[11px] truncate hidden sm:block" style={{ color: 'var(--color-text-tertiary)' }}>
              Full agentic AI with tools, memory, and web search
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Agent status badge */}
          {agentStatus && loading && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-bloom)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bloom)' }} />
              <span className="max-w-[120px] truncate">{agentStatus}</span>
            </div>
          )}
          {/* Artifacts toggle */}
          {hasArtifacts && (
            <button
              onClick={() => setShowArtifacts(!showArtifacts)}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: showArtifacts ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
                backgroundColor: showArtifacts ? 'var(--color-primary-soft)' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-soft)'}
              onMouseLeave={e => { if (!showArtifacts) e.currentTarget.style.backgroundColor = 'transparent'; }}
              title="Toggle artifacts panel"
            >
              {showArtifacts ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          )}
          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* ── Main area (chat + artifacts split) ─────────── */}
      <div className="flex-1 flex min-h-0">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto rounded-xl sm:rounded-2xl border p-3 sm:p-5 space-y-4 sm:space-y-5 relative"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* ── Empty state ────────────────────────── */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: 'var(--color-primary-soft)' }}
                >
                  <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: 'var(--color-bloom)' }} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-1.5" style={{ color: 'var(--color-ink)' }}>
                  How can I help you?
                </h2>
                <p className="text-xs sm:text-sm max-w-md mb-6 leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
                  I have access to your real portfolio data, tools to verify your proofs, and can give personalized career advice.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {SUGGESTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.text}
                        onClick={() => sendMessage(s.text)}
                        className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all duration-200 group"
                        style={{
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'var(--color-surface)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--color-bloom)';
                          e.currentTarget.style.color = 'var(--color-bloom)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-bloom)' }} />
                        <div className="min-w-0">
                          <span className="text-xs font-medium block leading-snug">{s.text}</span>
                          <span className="text-[10px] font-medium mt-0.5 block" style={{ color: 'var(--color-text-tertiary)' }}>
                            {s.category}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Messages ──────────────────────────── */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant avatar */}
                {message.role === 'assistant' && (
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--color-primary-soft)' }}
                  >
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-bloom)' }} />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? '' : 'space-y-2'}`}>
                  {/* ── Tool calls (collapsible) ─────── */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="space-y-1">
                      {message.toolCalls.map((tc, i) => {
                        const ToolIcon = getToolIcon(tc.tool);
                        const toolKey = `${message.id}-tool-${i}`;
                        const isExpanded = expandedTools[toolKey];
                        const isPending = tc.success === undefined;

                        return (
                          <div
                            key={i}
                            className="rounded-xl overflow-hidden"
                            style={{
                              border: `1px solid ${isPending ? 'var(--color-bloom)' : tc.success ? 'var(--color-border)' : 'rgba(238,66,102,0.3)'}`,
                              backgroundColor: isPending ? 'var(--color-primary-soft)' : 'var(--color-surface-dim)',
                            }}
                          >
                            <button
                              onClick={() => toggleToolExpand(toolKey)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs font-medium transition-colors"
                              style={{ color: 'var(--color-ink)' }}
                            >
                              {isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                              ) : tc.success ? (
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                              ) : (
                                <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-ember)' }} />
                              )}
                              <ToolIcon className="w-3 h-3 hidden sm:block flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                              <span className="font-semibold">{tc.tool}</span>
                              {tc.description && (
                                <span className="hidden md:inline truncate flex-1" style={{ color: 'var(--color-text-tertiary)' }}>
                                  — {tc.description}
                                </span>
                              )}
                              {!isPending && tc.data && (
                                <ChevronDown
                                  className="w-3 h-3 flex-shrink-0 transition-transform"
                                  style={{
                                    color: 'var(--color-text-tertiary)',
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                  }}
                                />
                              )}
                            </button>
                            {isExpanded && tc.data && (
                              <div
                                className="px-3 py-2 text-[11px] font-mono leading-relaxed overflow-x-auto"
                                style={{
                                  borderTop: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-surface)',
                                  color: 'var(--color-text-secondary)',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                }}
                              >
                                <pre className="whitespace-pre-wrap">{JSON.stringify(tc.data, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Sources ──────────────────────── */}
                  {message.sources && message.sources.length > 0 && (
                    <SourcesDisplay sources={message.sources} />
                  )}

                  {/* ── Message content ──────────────── */}
                  {message.content && (
                    <div
                      className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4"
                      style={{
                        backgroundColor: message.role === 'user' ? 'var(--color-ink)' : 'transparent',
                        color: message.role === 'user' ? 'var(--color-paper)' : 'var(--color-ink)',
                      }}
                    >
                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word' }}>
                          {message.content}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Streaming cursor ─────────────── */}
                  {message.isStreaming && message.content && (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <div className="w-1.5 h-4 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
                    </div>
                  )}

                  {/* ── Thinking (collapsible) ────────── */}
                  {message.thinking && (
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--color-border)' }}
                    >
                      <button
                        onClick={() => toggleThinking(message.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-[11px] sm:text-xs font-medium transition-colors"
                        style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-3 h-3" />
                          <span>Reasoning</span>
                        </div>
                        <ChevronDown
                          className="w-3 h-3 transition-transform"
                          style={{ transform: showThinking[message.id] ? 'rotate(180deg)' : 'rotate(0)' }}
                        />
                      </button>
                      {showThinking[message.id] && (
                        <div
                          className="px-3 py-2.5 text-[11px] sm:text-xs leading-relaxed"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-text-tertiary)',
                            borderTop: '1px solid var(--color-border)',
                          }}
                        >
                          {message.thinking}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Artifact chips ────────────────── */}
                  {message.artifacts && message.artifacts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {message.artifacts.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => selectArtifact(a.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{
                            border: '1px solid var(--color-border)',
                            backgroundColor: activeArtifactId === a.id ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                            color: activeArtifactId === a.id ? 'var(--color-bloom)' : 'var(--color-text-secondary)',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-bloom)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        >
                          <Wrench className="w-3 h-3" />
                          {a.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Metadata ──────────────────────── */}
                  {message.role === 'assistant' && !message.isStreaming && (
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.tokensUsed && message.tokensUsed > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {message.tokensUsed} tokens
                        </span>
                      )}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {message.iterations && message.iterations > 1 && (
                        <span className="hidden sm:flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          {message.iterations} iterations
                        </span>
                      )}
                      <div className="ml-auto">
                        <MessageRating messageId={message.id} />
                      </div>
                    </div>
                  )}
                </div>

                {/* User avatar */}
                {message.role === 'user' && (
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--color-surface-dim)' }}
                  >
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                )}
              </div>
            ))}

            {/* ── Loading indicator ──────────────────── */}
            {loading && !messages.some(m => m.isStreaming) && (
              <div className="flex gap-2.5 sm:gap-3 justify-start">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary-soft)' }}
                >
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-bloom)' }} />
                </div>
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: 'var(--color-surface-dim)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                      {agentStatus || 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Streaming with no content yet ──────── */}
            {loading && messages.some(m => m.isStreaming) && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-2.5 sm:gap-3 justify-start">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-primary-soft)' }}
                >
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-bloom)' }} />
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '200ms' }} />
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '400ms' }} />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {agentStatus || 'Connecting...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Scroll to bottom ───────────────────── */}
          {showScrollButton && (
            <button
              onClick={scrollToBottomManual}
              className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}

          {/* ── Input area (Claude-style) ─────────── */}
          <div className="mt-2 sm:mt-3 flex-shrink-0">
            <FileUpload
              files={attachedFiles}
              onFilesAdd={handleFilesAdd}
              onFileRemove={handleFileRemove}
              disabled={loading}
            />
            <form onSubmit={handleSubmit} className="flex gap-2 items-end rounded-2xl px-3 py-2" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Orin AI..."
                rows={1}
                className="flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-relaxed focus:outline-none max-h-[160px]"
                style={{ color: 'var(--color-ink)' }}
                disabled={loading}
              />
              {/* Send / Stop button */}
              {loading ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
                  title="Stop generating"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 disabled:opacity-30 flex-shrink-0"
                  style={{
                    backgroundColor: input.trim() ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                    color: input.trim() ? 'white' : 'var(--color-text-tertiary)',
                  }}
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
            <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Orin AI may make mistakes. Check important info.
            </p>
          </div>
        </div>

        {/* ── Artifacts panel (split-pane) ──────────── */}
        {showArtifacts && hasArtifacts && (
          <div className="w-[350px] sm:w-[420px] lg:w-[480px] flex-shrink-0 ml-3 hidden sm:block">
            <ArtifactsPanel
              artifacts={messages.flatMap(m => m.artifacts || [])}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={setActiveArtifactId}
              onClose={() => { setShowArtifacts(false); setActiveArtifactId(null); }}
              className="rounded-xl sm:rounded-2xl border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
