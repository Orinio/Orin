'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PanelLeft, ArrowDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chatStore } from '@/lib/chat-store';
import type { ChatConversation } from '@/lib/chat-types';
import ChatInput from '@/components/ai/ChatInput';
import SuperMessage, { type SuperMessageData } from '@/components/ai/SuperMessage';
import type { ToolStep } from '@/components/ai/StepIndicator';
import ChatHistory from '@/components/ai/ChatHistory';
import Logo from '@/components/Logo';

// ============================================================
// Super Agent Chat — Unified AI interface
// ============================================================

export default function SuperAgentChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SuperMessageData[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Helpers ──────────────────────────────────────

  const createConversation = useCallback(() => {
    const conv = chatStore.newConversation(user?.id || null, 'chat');
    setConversation(conv);
    setMessages([]);
    return conv;
  }, [user]);

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
        steps: m.toolCalls?.map(tc => ({
          name: tc.tool,
          status: 'success' as const,
          args: tc.args,
          result: tc.result,
        })),
        timestamp: new Date(m.timestamp),
      })));
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const tier = user?.id ? 'cloud' as const : 'local' as const;
    await chatStore.remove(id, user?.id || '', tier);
    if (conversation?.id === id) createConversation();
    setSidebarOpen(false);
  }, [conversation, user, createConversation]);

  // ── Scroll ───────────────────────────────────────

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

  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'user' || !last.isStreaming) scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // ── Update assistant message in-place ─────────────

  const updateAssistant = useCallback((id: string, patch: Partial<SuperMessageData>) => {
    setMessages(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(m => m.id === id);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], ...patch };
      }
      return updated;
    });
  }, []);

  // ── Send message ─────────────────────────────────

  const handleSend = useCallback(async (content: string) => {
    let conv = conversation;
    if (!conv) conv = createConversation();

    const userMsg: SuperMessageData = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const assistantId = `msg_${Date.now()}_assistant`;
    const assistantMsg: SuperMessageData = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
      steps: [],
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Save user message
    conv.messages.push({
      id: userMsg.id,
      role: 'user',
      content,
      timestamp: userMsg.timestamp.toISOString(),
    });

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
      let agentId = 'chat';
      let agentName = 'Orin';
      let tokensUsed = 0;
      let durationMs = 0;
      const steps: ToolStep[] = [];

      // ── Process a single SSE message ───────────
      const processMessage = (eventType: string, dataStr: string) => {
        try {
          const data = JSON.parse(dataStr);

          switch (eventType) {
            case 'start':
              if (data.agentId) agentId = data.agentId;
              break;

            case 'progress':
              // Overall progress tracking
              break;

            case 'thinking':
              if (data.content) thinking = data.content;
              updateAssistant(assistantId, { thinking: data.content });
              break;

            case 'tool_start': {
              const step: ToolStep = {
                name: data.tool,
                description: data.description,
                status: 'running',
                args: data.args,
                step: data.step,
              };
              steps.push(step);
              updateAssistant(assistantId, { steps: [...steps] });
              break;
            }

            case 'tool_result': {
              // Update the last matching step
              for (let i = steps.length - 1; i >= 0; i--) {
                if (steps[i].name === data.tool && steps[i].status === 'running') {
                  steps[i] = {
                    ...steps[i],
                    status: data.success ? 'success' : 'error',
                    durationMs: data.durationMs,
                    result: { success: data.success, data: data.data, error: data.error },
                  };
                  break;
                }
              }
              updateAssistant(assistantId, { steps: [...steps] });
              break;
            }

            case 'answer':
              if (data.content) {
                fullContent += data.content;
                updateAssistant(assistantId, { content: fullContent });
              }
              break;

            case 'complete':
              if (data.answer) fullContent = data.answer;
              if (data.thinking) thinking = data.thinking;
              if (data.agentId) agentId = data.agentId;
              if (data.agentName) agentName = data.agentName;
              if (data.tokensUsed) tokensUsed = data.tokensUsed;
              if (data.durationMs) durationMs = data.durationMs;
              if (data.toolCalls) {
                steps.length = 0;
                data.toolCalls.forEach((tc: any) => {
                  steps.push({
                    name: tc.tool,
                    status: tc.success ? 'success' : 'error',
                    args: tc.args,
                    result: { success: tc.success, data: tc.data, error: tc.error },
                    durationMs: tc.durationMs,
                  });
                });
              }
              updateAssistant(assistantId, {
                content: fullContent || 'No response generated.',
                thinking: thinking || undefined,
                agentId,
                agentName,
                tokensUsed,
                durationMs,
                steps: [...steps],
                isStreaming: false,
              });
              break;
          }
        } catch {}
      };

      // ── Read stream ────────────────────────────
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by blank lines)
        while (true) {
          const msgEnd = buffer.indexOf('\n\n');
          if (msgEnd === -1) break;

          const rawMessage = buffer.substring(0, msgEnd);
          buffer = buffer.substring(msgEnd + 2);

          let eventType = 'message';
          let dataStr = '';

          for (const line of rawMessage.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr = line.slice(6);
          }

          if (dataStr) processMessage(eventType, dataStr);
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        let eventType = 'message';
        let dataStr = '';
        for (const line of buffer.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6);
        }
        if (dataStr) processMessage(eventType, dataStr);
      }

      // Finalize
      updateAssistant(assistantId, {
        content: fullContent || 'I apologize, but I was unable to generate a response.',
        isStreaming: false,
        agentId,
        agentName,
        tokensUsed,
        durationMs,
        steps: steps.length > 0 ? [...steps] : undefined,
      });

      // Save to conversation
      conv.messages.push({
        id: assistantId,
        role: 'assistant',
        content: fullContent || 'No response',
        timestamp: new Date().toISOString(),
        agentId,
        thinking: thinking || undefined,
        toolCalls: steps.map(tc => ({ tool: tc.name, args: tc.args || {}, result: tc.result })),
      });
      conv.updatedAt = new Date().toISOString();
      conv.messageCount = conv.messages.length;
      await chatStore.save(conv, user?.id ? 'cloud' : 'local');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateAssistant(assistantId, {
          content: assistantMsg.content || 'Generation stopped.',
          isStreaming: false,
        });
      } else {
        updateAssistant(assistantId, {
          content: 'Something went wrong. Please try again.',
          isStreaming: false,
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversation, user, createConversation, updateAssistant]);

  const handleStop = useCallback(() => abortRef.current?.abort(), []);

  const handleNew = useCallback(() => {
    createConversation();
    setSidebarOpen(false);
  }, [createConversation]);

  // ── Render ───────────────────────────────────────

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
              Orin
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

      {/* Sidebar */}
      <ChatHistory
        currentConversationId={conversation?.id || null}
        onSelect={loadConversation}
        onNew={handleNew}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Chat area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isWelcome ? (
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
              I&apos;m your AI career assistant. I analyze your portfolio, find opportunities,
              verify projects, and plan your career path — all in one conversation.
            </p>

            <ChatInput onSend={handleSend} disabled={isStreaming} />
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <SuperMessage key={msg.id} message={msg} />
            ))}

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

      {/* Input (non-welcome) */}
      {!isWelcome && (
        <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
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
