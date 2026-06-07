'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, Sparkles, ArrowDown, PanelLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chatStore } from '@/lib/chat-store';
import type { ChatConversation } from '@/lib/chat-types';
import ChatInput from '@/components/ai/ChatInput';
import AgentMessage, { type AgentMessageData, type ToolCallInfo } from '@/components/ai/AgentMessage';
import ChatHistory from '@/components/ai/ChatHistory';
import Logo from '@/components/Logo';

// ============================================================
// Super-Agent Chat — Unified AI interface
// Replaces ai-chat, coach, and agent pages
// ============================================================

export default function SuperAgentChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessageData[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Create new conversation
  const createConversation = useCallback(() => {
    const conv = chatStore.newConversation(user?.id || null, 'chat');
    setConversation(conv);
    setMessages([]);
    return conv;
  }, [user]);

  // Load conversation
  const loadConversation = useCallback(async (conv: ChatConversation) => {
    setConversation(conv);
    const loaded = await chatStore.get(conv.id, conv.userId || '', conv.storage);
    if (loaded) {
      setMessages(loaded.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        agentId: m.agentId,
        thinking: m.thinking,
        toolCalls: m.toolCalls?.map(tc => ({ name: tc.tool, arguments: tc.args, result: tc.result })),
        timestamp: new Date(m.timestamp),
      })));
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    const tier = user?.id ? 'cloud' as const : 'local' as const;
    await chatStore.remove(id, user?.id || '', tier);
    if (conversation?.id === id) {
      createConversation();
    }
    setSidebarOpen(false);
  }, [conversation, user, createConversation]);

  // Scroll management
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'user' || !last.isStreaming) {
        scrollToBottom();
      }
    }
  }, [messages, scrollToBottom]);

  // Send message
  const handleSend = useCallback(async (content: string) => {
    let conv = conversation;
    if (!conv) {
      conv = createConversation();
    }

    // Add user message
    const userMsg: AgentMessageData = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantMsg: AgentMessageData = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Save user message to conversation
    conv.messages.push({
      id: userMsg.id,
      role: 'user',
      content,
      timestamp: userMsg.timestamp.toISOString(),
    });

    // Stream from super-agent
    try {
      abortRef.current = new AbortController();

      const res = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({
          message: content,
          history: conv.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let thinking = '';
      let toolCalls: ToolCallInfo[] = [];
      let agentId = 'chat';
      let tokensUsed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              // Handle SSE events by looking at the data shape
              if (data.agentId) agentId = data.agentId;
              if (data.tokensUsed) tokensUsed = data.tokensUsed;

              if (data.thinking) {
                thinking = data.thinking;
              }

              if (data.content || data.chunk) {
                fullContent += (data.content || data.chunk || '');
              }

              if (data.tool_call) {
                toolCalls = [...toolCalls, { name: data.tool_call.name, arguments: data.tool_call.arguments }];
              }

              if (data.tool_result) {
                toolCalls = toolCalls.map((tc, i) =>
                  i === toolCalls.length - 1
                    ? { ...tc, result: { success: data.tool_result.success, data: data.tool_result.data, error: data.tool_result.error } }
                    : tc
                );
              }

              if (data.answer) {
                fullContent = data.answer;
              }

              // Update the assistant message
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: fullContent,
                    thinking: thinking || undefined,
                    toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
                    agentId,
                    tokensUsed: tokensUsed || undefined,
                  };
                }
                return updated;
              });
            } catch {}
          }
        }
      }

      // Finalize
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: fullContent || 'I apologize, but I was unable to generate a response.',
            isStreaming: false,
            thinking: thinking || undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            agentId,
            tokensUsed: tokensUsed || undefined,
          };
        }
        return updated;
      });

      // Save to conversation
      conv.messages.push({
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: fullContent || 'No response',
        timestamp: new Date().toISOString(),
        agentId,
        thinking: thinking || undefined,
        toolCalls: toolCalls.map(tc => ({ tool: tc.name, args: tc.arguments || {}, result: tc.result })),
      });
      conv.updatedAt = new Date().toISOString();
      conv.messageCount = conv.messages.length;
      await chatStore.save(conv, user?.id ? 'cloud' : 'local');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, isStreaming: false, content: last.content || 'Generation stopped.' };
          }
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
              content: 'Something went wrong. Please try again.',
            };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversation, user, createConversation]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleNew = useCallback(() => {
    createConversation();
    setSidebarOpen(false);
  }, [createConversation]);

  // Initial welcome screen
  const isWelcome = messages.length === 0;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 h-12"
        style={{
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-paper)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--color-ink)' }}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span
              className="text-sm font-semibold hidden sm:inline"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}
            >
              Orin AI
            </span>
          </div>
        </div>

        {conversation && (
          <div className="text-xs opacity-40 truncate max-w-[200px] sm:max-w-[400px]" style={{ fontFamily: 'var(--font-mono)' }}>
            {conversation.title}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]"
            style={{
              backgroundColor: 'var(--color-surface-dim)',
              color: 'var(--color-mist)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
            Super Agent
          </div>
        </div>
      </header>

      {/* Chat History Sidebar */}
      <ChatHistory
        currentConversationId={conversation?.id || null}
        onSelect={loadConversation}
        onNew={handleNew}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main chat area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isWelcome ? (
          /* Welcome screen */
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{
                backgroundColor: 'var(--color-ink)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'var(--color-spark)' }} />
            </div>

            <h1
              className="text-2xl sm:text-3xl font-bold mb-2 text-center"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}
            >
              What can I help you with?
            </h1>
            <p
              className="text-sm mb-10 text-center max-w-md leading-relaxed"
              style={{ color: 'var(--color-mist)', fontFamily: 'var(--font-body)' }}
            >
              I&apos;m your AI career assistant. Ask me anything about your portfolio,
              skills, opportunities, or career growth.
            </p>

            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        ) : (
          /* Messages */
          <div className="py-4">
            {messages.map((msg) => (
              <AgentMessage key={msg.id} message={msg} />
            ))}

            {/* Scroll to bottom button */}
            {showScrollDown && (
              <button
                onClick={() => scrollToBottom()}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area (when not welcome) */}
      {!isWelcome && (
        <div
          className="flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            disabled={isStreaming}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}
