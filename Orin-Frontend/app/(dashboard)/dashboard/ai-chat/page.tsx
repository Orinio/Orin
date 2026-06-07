'use client';

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  tokensUsed?: number;
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // Scroll on message changes (including streaming updates)
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Also scroll when loading state changes
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
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
        throw new Error(data.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullContent } : m
                ));
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
            }
          }
        }
      }

      if (!fullContent) {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'I apologize, but I was unable to generate a response. Please try again.' }
            : m
        ));
      } else {
        // Parse JSON response if it contains thinking/answer structure
        try {
          const trimmed = fullContent.trim();
          // Check if the response is JSON with thinking/answer structure
          if (trimmed.startsWith('{') && trimmed.includes('"answer"')) {
            const parsed = JSON.parse(trimmed);
            if (parsed.answer) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: parsed.answer, thinking: parsed.thinking }
                  : m
              ));
            }
          }
        } catch {
          // If JSON parsing fails, keep the raw content
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
          : m
      ));
    } finally {
      setLoading(false);
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
  };

  const toggleThinking = (id: string) => {
    setShowThinking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>AI Assistant</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Ask anything about your career, skills, and portfolio</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium transition-all duration-200 border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-surface)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto rounded-[var(--radius-xl)] border p-5 space-y-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-[var(--radius-2xl)] flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
              <MessageSquare className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-ink)' }}>How can I help you?</h2>
            <p className="text-sm max-w-md mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              I can analyze your portfolio, suggest skills to learn, recommend certifications, and help with career planning.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTIONS.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.text}
                    onClick={() => sendMessage(suggestion.text)}
                    className="flex items-center gap-2.5 p-3 rounded-[var(--radius-lg)] text-left text-sm transition-all duration-200 border"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-bloom)'; e.currentTarget.style.color = 'var(--color-bloom)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                    <span className="truncate">{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
                <Bot className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
              </div>
            )}
            <div className={`max-w-[75%] ${message.role === 'user' ? '' : 'space-y-2'}`}>
              <div
                className="rounded-[var(--radius-lg)] px-4 py-3"
                style={{
                  backgroundColor: message.role === 'user' ? 'var(--color-ink)' : 'var(--color-surface-dim)',
                  color: message.role === 'user' ? 'var(--color-paper)' : 'var(--color-ink)',
                  boxShadow: message.role === 'user' ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                  border: message.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word' }}>
                  {message.content.split('\n').map((line, i) => {
                    // Handle bullet points
                    if (line.match(/^[\s]*[-•*]\s/)) {
                      return <div key={i} className="ml-2 mt-1">{line}</div>;
                    }
                    // Handle numbered lists
                    if (line.match(/^[\s]*\d+\.\s/)) {
                      return <div key={i} className="ml-2 mt-1">{line}</div>;
                    }
                    // Handle headers (### or ##)
                    if (line.match(/^#{1,3}\s/)) {
                      return <div key={i} className="font-bold mt-2 mb-1">{line.replace(/^#+\s*/, '')}</div>;
                    }
                    // Handle bold text
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

              {message.thinking && (
                <div className="rounded-[var(--radius-md)] overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => toggleThinking(message.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3 h-3" />
                      <span>Reasoning</span>
                    </div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{showThinking[message.id] ? 'Hide' : 'Show'}</span>
                  </button>
                  {showThinking[message.id] && (
                    <div className="px-3 py-2 text-[11px] leading-relaxed" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-tertiary)' }}>
                      {message.thinking}
                    </div>
                  )}
                </div>
              )}

              {message.role === 'assistant' && (
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
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                <User className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
              <Bot className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <div className="rounded-[var(--radius-lg)] px-4 py-3 border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-bloom)', animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your career, skills, or portfolio..."
          rows={1}
          className="flex-1 resize-none rounded-[var(--radius-lg)] px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-ink)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-lg)] transition-all duration-200 disabled:opacity-40"
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
