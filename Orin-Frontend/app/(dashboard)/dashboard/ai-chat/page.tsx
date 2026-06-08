'use client';

import { useState, useRef, useCallback } from 'react';
import { PanelLeft, ArrowDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chatStore } from '@/lib/chat-store';
import type { ChatConversation } from '@/lib/chat-types';
import ChatInput, { CHAT_MODELS } from '@/components/ai/ChatInput';
import SuperMessage, { type SuperMessageData } from '@/components/ai/SuperMessage';
import type { ToolStep } from '@/components/ai/StepIndicator';
import ChatHistory from '@/components/ai/ChatHistory';
import Logo from '@/components/Logo';

export default function SuperAgentChat() {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<SuperMessageData[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  // Default to the optimized GPT‑OSS 120B model unless the user selects another one
  const defaultModelId = CHAT_MODELS.find(m => m.id === 'openai/gpt-oss-120b')?.id ?? CHAT_MODELS[0].id;
  const [selectedModel, setSelectedModel] = useState(defaultModelId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isUserScrolledRef = useRef(false);

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
        visualSpecs: m.visualSpecs,
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

  const scrollToBottom = useCallback((smooth = true) => {
    if (!isUserScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollDown(!atBottom);
    isUserScrolledRef.current = !atBottom;
  }, []);

  const updateAssistant = useCallback((id: string, patch: Partial<SuperMessageData>) => {
    setMessages(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(m => m.id === id);
      if (idx !== -1) updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  }, []);

  const handleSend = useCallback(async (content: string, files?: File[], modelId?: string) => {
    let conv = conversation;
    if (!conv) conv = createConversation();
    isUserScrolledRef.current = false;

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

    conv.messages.push({
      id: userMsg.id,
      role: 'user',
      content,
      timestamp: userMsg.timestamp.toISOString(),
    });

    let fullContent = '';
    let thinking = '';
    let agentId = 'chat';
    let agentName = 'Orin';
    let tokensUsed = 0;
    let durationMs = 0;
    const steps: ToolStep[] = [];
    const visualSpecs: Array<Record<string, any>> = [];

    try {
      abortRef.current = new AbortController();

      let attachments: Array<{ name: string; type: string; base64: string }> | undefined;
      if (files && files.length > 0) {
        attachments = await Promise.all(
          files.map(async (f) => {
            const buffer = await f.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            return { name: f.name, type: f.type, base64 };
          })
        );
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: content,
          model: modelId || selectedModel,
          history: conv.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          ...(attachments && { attachments }),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      const processMessage = (eventType: string, dataStr: string) => {
        try {
          const data = JSON.parse(dataStr);
          switch (eventType) {
            case 'start':
              if (data.agentId) agentId = data.agentId;
              break;
            case 'thinking':
              if (data.content) thinking = data.content;
              updateAssistant(assistantId, { thinking: data.content });
              break;
            case 'tool_start': {
              const step: ToolStep = { name: data.tool, description: data.description, status: 'running', args: data.args, step: data.step };
              steps.push(step);
              updateAssistant(assistantId, { steps: [...steps] });
              break;
            }
            case 'tool_result': {
              for (let i = steps.length - 1; i >= 0; i--) {
                if (steps[i].name === data.tool && steps[i].status === 'running') {
                  steps[i] = { ...steps[i], status: data.success ? 'success' : 'error', durationMs: data.durationMs, result: { success: data.success, data: data.data, error: data.error } };
                  break;
                }
              }
              updateAssistant(assistantId, { steps: [...steps] });
              break;
            }
            case 'answer':
              if (data.content) { fullContent += data.content; updateAssistant(assistantId, { content: fullContent }); }
              break;
            case 'visual_spec':
              if (data.spec) { visualSpecs.push(data.spec); updateAssistant(assistantId, { visualSpecs: [...visualSpecs] }); }
              break;
            case 'complete':
              if (data.answer) fullContent = data.answer;
              if (data.thinking) thinking = data.thinking;
              if (data.agentId) agentId = data.agentId;
              if (data.agentName) agentName = data.agentName;
              if (data.tokensUsed) tokensUsed = data.tokensUsed;
              if (data.durationMs) durationMs = data.durationMs;
              if (data.visualSpecs) { visualSpecs.length = 0; data.visualSpecs.forEach((s: any) => visualSpecs.push(s)); }
              if (data.toolCalls) {
                steps.length = 0;
                data.toolCalls.forEach((tc: any) => { steps.push({ name: tc.tool, status: tc.success ? 'success' : 'error', args: tc.args, result: { success: tc.success, data: tc.data, error: tc.error }, durationMs: tc.durationMs }); });
              }
              updateAssistant(assistantId, {
                content: fullContent || 'No response generated.', thinking: thinking || undefined, agentId, agentName, tokensUsed, durationMs,
                steps: [...steps], visualSpecs: visualSpecs.length > 0 ? [...visualSpecs] : undefined, isStreaming: false,
              });
              break;
          }
        } catch {}
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
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

      if (buffer.trim()) {
        let eventType = 'message';
        let dataStr = '';
        for (const line of buffer.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6);
        }
        if (dataStr) processMessage(eventType, dataStr);
      }

      updateAssistant(assistantId, {
        content: fullContent || 'I apologize, but I was unable to generate a response.', isStreaming: false,
        agentId, agentName, tokensUsed, durationMs,
        steps: steps.length > 0 ? [...steps] : undefined,
        visualSpecs: visualSpecs.length > 0 ? [...visualSpecs] : undefined,
      });

      conv.messages.push({
        id: assistantId, role: 'assistant', content: fullContent || 'No response', timestamp: new Date().toISOString(),
        agentId, thinking: thinking || undefined,
        toolCalls: steps.map(tc => ({ tool: tc.name, args: tc.args || {}, result: tc.result })),
        visualSpecs: visualSpecs.length > 0 ? visualSpecs : undefined,
      });
      conv.updatedAt = new Date().toISOString();
      conv.messageCount = conv.messages.length;
      await chatStore.save(conv, user?.id ? 'cloud' : 'local');

    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateAssistant(assistantId, { content: assistantMsg.content || 'Generation stopped.', isStreaming: false });
      } else {
        updateAssistant(assistantId, { content: fullContent || undefined, error: 'Something went wrong. Please try again.', isStreaming: false });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversation, user, createConversation, updateAssistant, selectedModel]);

  const handleStop = useCallback(() => abortRef.current?.abort(), []);

  const handleRate = useCallback(async (messageId: string, rating: 'positive' | 'negative' | 'flagged', feedback?: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, rating, ratingFeedback: feedback } : m));
    if (conversation) {
      const msg = conversation.messages.find(m => m.id === messageId);
      if (msg) { msg.rating = rating; msg.ratingFeedback = feedback; await chatStore.save(conversation, user?.id ? 'cloud' : 'local'); }
    }
  }, [conversation, user]);

  const handleRetry = useCallback((messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        handleSend(messages[i].content);
        return;
      }
    }
  }, [messages, handleSend]);

  const handleNew = useCallback(() => { createConversation(); setSidebarOpen(false); }, [createConversation]);

  const isWelcome = messages.length === 0;
  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) || CHAT_MODELS[0];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 h-12"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-paper)' }}
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
            <span className="text-sm font-semibold hidden sm:inline" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
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
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]"
            style={{ backgroundColor: 'var(--color-surface-dim)', color: currentModel.badgeColor || 'var(--color-mist)', fontFamily: 'var(--font-mono)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentModel.badgeColor || 'var(--color-bloom)' }} />
            {currentModel.name.split(' ').slice(0, 2).join(' ')}
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]"
            style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-mist)', fontFamily: 'var(--font-mono)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
            Agent
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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {isWelcome ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'var(--color-ink)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
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
              I&apos;m your AI career assistant. Pick a model, then ask me anything about your portfolio, skills, or job search.
            </p>
            <ChatInput
              onSend={handleSend}
              disabled={isStreaming}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        ) : (
          <div className="py-4 max-w-4xl mx-auto">
            {messages.map((msg) => (
              <SuperMessage key={msg.id} message={msg} onRate={handleRate} onRetry={handleRetry} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Floating scroll-to-bottom */}
        {showScrollDown && !isWelcome && (
          <button
            onClick={() => { isUserScrolledRef.current = false; messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
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
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      )}
    </div>
  );
}
