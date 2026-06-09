'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PanelLeftClose, Sparkles, ArrowDown, Loader2, Brain, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chatStore } from '@/lib/chat-store';
import type { ChatConversation } from '@/lib/chat-types';
import ChatInput, { CHAT_MODELS } from '@/components/ai/ChatInput';
import SuperMessage, { type SuperMessageData } from '@/components/ai/SuperMessage';
import type { ToolStep } from '@/components/ai/StepIndicator';
import ChatHistory from '@/components/ai/ChatHistory';
import Logo from '@/components/Logo';
import {
  ActivityPanel,
  WorkspacePanel,
  ProjectHeader,
  ReasoningSummaryCard,
  Composer,
  type ActivityItem,
  type WorkspaceMode,
  type WorkspaceArtifact,
  type AgentState,
} from '@/components/ai/workspace';

// ─── Usage Bar ───────────────────────────────────────────
interface UsageData {
  plan: string;
  planName: string;
  usage: Record<string, { used: number; limit: number; remaining: number; resetsAt: string }>;
  tokenBudget: { used: number; limit: number; remaining: number };
}

function UsageBar({ session, onRefreshRef }: { session: any; onRefreshRef?: React.MutableRefObject<(() => void) | null> }) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/ai/usage', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUsage(data.data);
      }
    } catch {}
    setLoading(false);
  }, [session?.access_token]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000); // Refresh every 30s
    if (onRefreshRef) onRefreshRef.current = fetchUsage;
    return () => { clearInterval(interval); if (onRefreshRef) onRefreshRef.current = null; };
  }, [fetchUsage, onRefreshRef]);

  if (loading || !usage) return null;

  const chatUsage = usage.usage['ai-chat-stream'] || usage.usage['ai-chat'] || { used: 0, limit: 15, remaining: 15 };
  const percent = Math.min(100, (chatUsage.used / chatUsage.limit) * 100);
  const isLow = percent > 80;
  const isExhausted = percent >= 100;

  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 text-xs"
      style={{
        backgroundColor: isExhausted ? 'rgba(239,68,68,0.08)' : 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        color: 'var(--color-mist)',
      }}
    >
      <span
        className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
        style={{
          backgroundColor: usage.plan === 'pro' ? 'rgba(139,92,246,0.12)' : usage.plan === 'team' ? 'rgba(59,130,246,0.12)' : 'rgba(107,114,128,0.12)',
          color: usage.plan === 'pro' ? '#8b5cf6' : usage.plan === 'team' ? '#3b82f6' : '#6b7280',
        }}
      >
        {usage.planName}
      </span>

      <div className="flex-1 max-w-[200px]">
        <div className="flex items-center justify-between mb-0.5">
          <span style={{ color: 'var(--color-mist)' }}>AI Messages</span>
          <span style={{ color: isExhausted ? '#ef4444' : isLow ? '#f59e0b' : 'var(--color-mist)' }}>
            {chatUsage.used}/{chatUsage.limit}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              backgroundColor: isExhausted ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e',
            }}
          />
        </div>
      </div>

      {isExhausted && usage.plan === 'free' && (
        <a
          href="/settings?tab=billing"
          className="px-2 py-1 rounded text-[10px] font-semibold hover:opacity-80 transition-opacity"
          style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
        >
          Upgrade
        </a>
      )}

      {isExhausted && usage.plan !== 'free' && chatUsage.resetsAt && (
        <span className="text-[10px]" style={{ color: 'var(--color-mist)' }}>
          Resets {new Date(chatUsage.resetsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

export default function SuperAgentChat() {
  const { user, session } = useAuth();

  // ─── State ───────────────────────────────────────────
  const [messages, setMessages] = useState<SuperMessageData[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [artifacts, setArtifacts] = useState<WorkspaceArtifact[]>([]);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('chat');
  const [currentReasoning, setCurrentReasoning] = useState('');

  // Default to GPT-OSS 120B
  const defaultModelId = CHAT_MODELS.find(m => m.id === 'openai/gpt-oss-120b')?.id ?? CHAT_MODELS[0].id;
  const [selectedModel, setSelectedModel] = useState(defaultModelId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isUserScrolledRef = useRef(false);
  const usageRefreshRef = useRef<(() => void) | null>(null);

  // ─── Conversation management ──────────────────────────
  const createConversation = useCallback(() => {
    const conv = chatStore.newConversation(user?.id || null, 'chat');
    setConversation(conv);
    setMessages([]);
    setActivities([]);
    setArtifacts([]);
    setCurrentReasoning('');
    setAgentState('idle');
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

  // ─── Scroll management ────────────────────────────────
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

  // ─── Message update helper ────────────────────────────
  const updateAssistant = useCallback((id: string, patch: Partial<SuperMessageData>) => {
    setMessages(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(m => m.id === id);
      if (idx !== -1) updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  }, []);

  // ─── Activity helpers ─────────────────────────────────
  const addActivity = useCallback((item: ActivityItem) => {
    setActivities(prev => [...prev, item]);
  }, []);

  const updateActivity = useCallback((id: string, patch: Partial<ActivityItem>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  // ─── SSE Streaming with tool activity tracking ────────
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
    setAgentState('thinking');
    setActivities([]);
    setArtifacts([]);
    setCurrentReasoning('');

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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const details = errorData?.error?.details;
        if (res.status === 429 && details) {
          const waitDisplay = details.retryAfterDisplay || 'a few minutes';
          const planName = details.planName || 'Free';
          const used = details.usage?.used ?? '?';
          const limit = details.usage?.limit ?? '?';
          throw new Error(
            `RATE_LIMITED:${JSON.stringify({
              message: errorData.error.message,
              planName,
              used,
              limit,
              waitDisplay,
              upgradeMessage: details.upgradeMessage,
              upgradeUrl: details.upgradeUrl,
            })}`
          );
        }
        throw new Error(errorData?.error?.message || `HTTP ${res.status}`);
      }

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
              setAgentState('planning');
              break;
            case 'thinking':
              if (data.content) {
                thinking = data.content;
                setCurrentReasoning(data.content);
                setAgentState('thinking');
                updateAssistant(assistantId, { thinking: data.content });
              }
              break;
            case 'tool_start': {
              const step: ToolStep = { name: data.tool, description: data.description, status: 'running', args: data.args, step: data.step };
              steps.push(step);
              setAgentState('using_tool');
              setWorkspaceMode('build');
              updateAssistant(assistantId, { steps: [...steps] });
              addActivity({
                id: `act_${Date.now()}_${data.tool}`,
                type: 'tool_call',
                name: data.tool,
                label: data.description || data.tool,
                status: 'running',
                description: data.description,
                timestamp: new Date(),
              });
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
              // Update the latest matching activity
              setActivities(prev => {
                const updated = [...prev];
                for (let i = updated.length - 1; i >= 0; i--) {
                  if (updated[i].name === data.tool && updated[i].status === 'running') {
                    updated[i] = {
                      ...updated[i],
                      status: data.success ? 'success' : 'error',
                      durationMs: data.durationMs,
                    };
                    break;
                  }
                }
                return updated;
              });
              break;
            }
            case 'answer':
              if (data.content) {
                fullContent += data.content;
                setAgentState('generating');
                updateAssistant(assistantId, { content: fullContent });
              }
              break;
            case 'visual_spec':
              if (data.spec) {
                visualSpecs.push(data.spec);
                updateAssistant(assistantId, { visualSpecs: [...visualSpecs] });
                setArtifacts(prev => [...prev, {
                  id: `art_${Date.now()}_${prev.length}`,
                  type: 'text',
                  title: data.spec.title || 'Visual Output',
                  content: JSON.stringify(data.spec, null, 2),
                  createdAt: new Date(),
                }]);
              }
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
              setAgentState('idle');
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
        setAgentState('paused');
      } else if (err.message?.startsWith('RATE_LIMITED:')) {
        try {
          const details = JSON.parse(err.message.slice('RATE_LIMITED:'.length));
          const errorMessage = [
            `**Rate Limit Reached** — ${details.planName} plan`,
            ``,
            `You've used **${details.used}/${details.limit}** AI messages today.`,
            `Please wait **${details.waitDisplay}** before trying again.`,
            details.upgradeMessage ? `\n💡 ${details.upgradeMessage}` : '',
          ].filter(Boolean).join('\n');
          updateAssistant(assistantId, { content: errorMessage, isStreaming: false });
          setAgentState('idle');
        } catch {
          updateAssistant(assistantId, { content: 'Rate limit reached. Please try again shortly.', isStreaming: false });
          setAgentState('idle');
        }
        // Refresh usage bar
        usageRefreshRef.current?.();
      } else {
        updateAssistant(assistantId, { content: assistantMsg.content || undefined, error: 'Something went wrong. Please try again.', isStreaming: false });
        setAgentState('error');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversation, user, createConversation, updateAssistant, selectedModel, addActivity]);

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

  // ─── Derived state ────────────────────────────────────
  const isWelcome = messages.length === 0;
  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) || CHAT_MODELS[0];
  const projectTitle = conversation?.title || 'Orin';
  const runningActivityCount = activities.filter(a => a.status === 'running').length;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden -mx-4 -mt-8"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* ── Header ── */}
      <ProjectHeader
        title={projectTitle}
        agentState={agentState}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleActivity={() => setActivityOpen(!activityOpen)}
        activityCount={runningActivityCount}
        isStreaming={isStreaming}
      />

      {/* ── Usage Bar ── */}
      <UsageBar session={session} onRefreshRef={usageRefreshRef} />

      {/* ── Main content area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat history sidebar */}
        <ChatHistory
          currentConversationId={conversation?.id || null}
          onSelect={loadConversation}
          onNew={handleNew}
          onDelete={deleteConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Chat + Workspace panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat panel */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 flex flex-col overflow-y-auto"
            style={{
              scrollBehavior: 'smooth',
              maxWidth: activityOpen ? '50%' : '100%',
              transition: 'max-width 0.3s ease',
            }}
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
                <Composer
                  onSend={handleSend}
                  disabled={isStreaming}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
            ) : (
              <div className="py-4 max-w-4xl mx-auto w-full">
                {messages.map((msg) => (
                  <SuperMessage key={msg.id} message={msg} onRate={handleRate} onRetry={handleRetry} />
                ))}

                {/* Live reasoning card during streaming */}
                {isStreaming && currentReasoning && (
                  <div className="max-w-4xl mx-auto px-4 py-2">
                    <ReasoningSummaryCard content={currentReasoning} />
                  </div>
                )}

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

          {/* Activity panel (right side, collapsible) */}
          {activityOpen && (
            <div
              className="flex-shrink-0 border-l overflow-hidden"
              style={{
                width: '280px',
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <ActivityPanel
                activities={activities}
                isStreaming={isStreaming}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Composer (bottom, non-welcome) ── */}
      {!isWelcome && (
        <div
          className="flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <Composer
            onSend={handleSend}
            onStop={handleStop}
            disabled={isStreaming}
            isStreaming={isStreaming}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>
      )}

      {/* ── Activity drawer for mobile ── */}
      {activityOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setActivityOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute right-0 top-12 bottom-0 w-72 shadow-xl"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ActivityPanel
              activities={activities}
              isStreaming={isStreaming}
            />
          </div>
        </div>
      )}
    </div>
  );
}
