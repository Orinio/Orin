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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  tokensUsed?: number;
  iterations?: number;
  timestamp: Date;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  { text: 'What skills should I learn next?', icon: Zap },
  { text: 'How can I improve my GitHub profile?', icon: Bot },
  { text: 'What certifications should I pursue?', icon: Sparkles },
  { text: 'Help me prepare for technical interviews', icon: Brain },
  { text: 'What projects should I add to my portfolio?', icon: Lightbulb },
  { text: 'How do I stand out to recruiters?', icon: MessageSquare },
];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if user is near the bottom of the scroll container
  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Scroll to bottom only if auto-scroll is on or user is near bottom
  const scrollToBottom = useCallback((force = false) => {
    if (force || autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [autoScroll]);

  // Detect when user scrolls manually
  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
    // If user scrolls back to bottom, re-enable auto-scroll
    if (nearBottom && !autoScroll) {
      setAutoScroll(true);
    }
  }, [isNearBottom, autoScroll]);

  // Scroll on new messages (only if auto-scroll is enabled)
  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 50);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Also scroll when loading starts
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 120;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

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
    setAgentStatus('Starting...');
    setAutoScroll(true);
    setShowScrollButton(false);

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ message: text.trim(), history }),
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
          if (line.startsWith('event: ')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            try {
              const parsed = JSON.parse(dataStr);
              handleStreamEvent(parsed, assistantId);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
          : m
      ));
    } finally {
      setLoading(false);
      setAgentStatus('');
    }
  };

  const handleStreamEvent = (data: any, assistantId: string) => {
    if (data.agentId && data.query) {
      setAgentStatus('Analyzing your request...');
      return;
    }

    if (data.tool && data.args && data.success === undefined) {
      setAgentStatus(`Using ${data.tool}...`);
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        const toolCalls = [...(m.toolCalls || []), { tool: data.tool, args: data.args, description: data.description }];
        return { ...m, toolCalls };
      }));
      return;
    }

    if (data.tool && data.success !== undefined) {
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        const toolCalls = (m.toolCalls || []).map(tc =>
          tc.tool === data.tool && tc.success === undefined
            ? { ...tc, success: data.success, data: data.data, error: data.error }
            : tc
        );
        return { ...m, toolCalls };
      }));
      setAgentStatus(data.success ? `${data.tool} done` : `${data.tool} failed`);
      return;
    }

    if (data.thinking) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, thinking: data.thinking } : m
      ));
      setAgentStatus('Thinking...');
      return;
    }

    if (data.content && !data.answer) {
      setMessages(prev => prev.map(m => {
        if (m.id !== assistantId) return m;
        return { ...m, content: m.content + data.content };
      }));
      setAgentStatus('Generating...');
      return;
    }

    if (data.answer && data.agentId) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? {
              ...m,
              content: data.answer || m.content,
              thinking: data.thinking || m.thinking,
              toolCalls: data.toolCalls || m.toolCalls,
              tokensUsed: data.tokensUsed,
              iterations: data.iterations,
              isStreaming: false,
            }
          : m
      ));
      setAgentStatus('');
      return;
    }

    if (data.message && !data.tool) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: data.message || 'An error occurred', isStreaming: false }
          : m
      ));
      setAgentStatus('');
      return;
    }
  };

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
    setAgentStatus('');
  };

  const toggleThinking = (id: string) => {
    setShowThinking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToBottomManual = () => {
    scrollToBottom(true);
    setAutoScroll(true);
    setShowScrollButton(false);
  };

  const getToolIcon = (toolName: string) => {
    if (toolName.includes('verify') || toolName.includes('check')) return CheckCircle2;
    if (toolName.includes('extract') || toolName.includes('analyze')) return Brain;
    if (toolName.includes('search') || toolName.includes('fetch')) return Zap;
    return Wrench;
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)]">
      {/* Header */}
      <header className="flex items-center justify-between mb-3 sm:mb-5 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--color-ink)' }}>AI Agent</h1>
            <p className="text-[10px] sm:text-xs truncate hidden sm:block" style={{ color: 'var(--color-text-tertiary)' }}>Full agentic AI with tools, memory, and real data access</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {agentStatus && loading && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-bloom)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bloom)' }} />
              <span className="max-w-[120px] truncate">{agentStatus}</span>
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-[var(--radius-md)] text-xs font-medium transition-all duration-200 border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-surface)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto rounded-[var(--radius-xl)] border p-3 sm:p-5 space-y-3 sm:space-y-4 relative"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[var(--radius-2xl)] flex items-center justify-center mb-4 sm:mb-5" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <h2 className="text-base sm:text-lg font-bold mb-1" style={{ color: 'var(--color-ink)' }}>How can I help you?</h2>
            <p className="text-xs sm:text-sm max-w-md mb-4 sm:mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              I have access to your real portfolio data, tools to verify your proofs, and can give personalized career advice.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTIONS.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.text}
                    onClick={() => sendMessage(suggestion.text)}
                    className="flex items-center gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-[var(--radius-lg)] text-left text-xs sm:text-sm transition-all duration-200 border"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-bloom)'; e.currentTarget.style.color = 'var(--color-bloom)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                    <span className="truncate">{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-bloom)' }} />
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? '' : 'space-y-1.5 sm:space-y-2'}`}>
              {/* Tool Calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="space-y-1">
                  {message.toolCalls.map((tc, i) => {
                    const ToolIcon = getToolIcon(tc.tool);
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-[var(--radius-md)] text-[10px] sm:text-xs border"
                        style={{
                          borderColor: tc.success === undefined ? 'var(--color-bloom)' : tc.success ? 'var(--color-border)' : 'var(--color-ember)',
                          backgroundColor: tc.success === undefined ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                          opacity: tc.success === undefined ? 0.8 : 1,
                        }}
                      >
                        {tc.success === undefined ? (
                          <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" style={{ color: 'var(--color-bloom)' }} />
                        ) : tc.success ? (
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: 'var(--color-bloom)' }} />
                        ) : (
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: 'var(--color-ember)' }} />
                        )}
                        <ToolIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 hidden sm:block" style={{ color: 'var(--color-text-tertiary)' }} />
                        <span className="font-medium truncate" style={{ color: 'var(--color-ink)' }}>{tc.tool}</span>
                        {tc.description && (
                          <span className="hidden md:inline truncate" style={{ color: 'var(--color-text-tertiary)' }}>- {tc.description}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Message Content */}
              {message.content && (
                <div
                  className="rounded-[var(--radius-lg)] px-3 py-2.5 sm:px-4 sm:py-3"
                  style={{
                    backgroundColor: message.role === 'user' ? 'var(--color-ink)' : 'var(--color-surface-dim)',
                    color: message.role === 'user' ? 'var(--color-paper)' : 'var(--color-ink)',
                    boxShadow: message.role === 'user' ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                    border: message.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word' }}>
                    {message.content.split('\n').map((line, i) => {
                      if (line.match(/^[\s]*[-•*]\s/)) {
                        return <div key={i} className="ml-2 mt-1">{line}</div>;
                      }
                      if (line.match(/^[\s]*\d+\.\s/)) {
                        return <div key={i} className="ml-2 mt-1">{line}</div>;
                      }
                      if (line.match(/^#{1,3}\s/)) {
                        return <div key={i} className="font-bold mt-2 mb-1">{line.replace(/^#+\s*/, '')}</div>;
                      }
                      if (line.includes('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/g);
                        return (
                          <div key={i}>
                            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                          </div>
                        );
                      }
                      return <div key={i}>{line || <br />}</div>;
                    })}
                  </div>
                </div>
              )}

              {/* Streaming indicator */}
              {message.isStreaming && message.content && (
                <div className="flex items-center gap-1.5 px-2">
                  <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-bloom)' }} />
                </div>
              )}

              {/* Thinking */}
              {message.thinking && (
                <div className="rounded-[var(--radius-md)] overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => toggleThinking(message.id)}
                    className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Brain className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>Reasoning</span>
                    </div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{showThinking[message.id] ? 'Hide' : 'Show'}</span>
                  </button>
                  {showThinking[message.id] && (
                    <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] leading-relaxed" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }}>
                      {message.thinking}
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {message.role === 'assistant' && !message.isStreaming && (
                <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.tokensUsed && message.tokensUsed > 0 && (
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {message.tokensUsed}t
                    </span>
                  )}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Wrench className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {message.iterations && message.iterations > 1 && (
                    <span className="hidden sm:flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      {message.iterations} iter
                    </span>
                  )}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-text-secondary)' }} />
              </div>
            )}
          </div>
        ))}

        {loading && !messages.some(m => m.isStreaming) && (
          <div className="flex gap-2 sm:gap-3 justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <div className="rounded-[var(--radius-lg)] px-3 py-2 sm:px-4 sm:py-3 border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] sm:text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  {agentStatus || 'Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottomManual}
          className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-2 sm:mt-4 flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your career..."
          rows={1}
          className="flex-1 resize-none rounded-[var(--radius-lg)] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm transition-all duration-200 focus:outline-none focus:ring-2 max-h-[120px]"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-ink)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-[var(--radius-lg)] transition-all duration-200 disabled:opacity-40 flex-shrink-0"
          style={{
            backgroundColor: input.trim() ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
            color: input.trim() ? 'white' : 'var(--color-text-tertiary)',
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
