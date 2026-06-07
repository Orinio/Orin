'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { api, type AgentResult } from '@/lib/api-client';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Wrench,
  Clock,
  ChevronDown,
  Brain,
  Zap,
  Target,
  BarChart3,
  BookOpen,
  Trophy,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePlan } from '@/lib/plan-context';
import { chatStore } from '@/lib/chat-store';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import type { ChatConversation, ChatMessage } from '@/lib/chat-types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId?: string;
  toolCalls?: Array<{ tool: string; args: any; result: any }>;
  durationMs?: number;
  thinking?: string;
}

interface AgentChatProps {
  initialAgent?: string;
  onMessageSent?: (message: string) => void;
}

const AGENTS = [
  { id: 'chat', name: 'Chat Assistant', icon: Bot, color: 'var(--color-bloom)', desc: 'General career guidance' },
  { id: 'coach', name: 'Career Coach', icon: Target, color: 'var(--color-pulse)', desc: 'Strategic career planning' },
  { id: 'skillAnalyst', name: 'Skill Analyst', icon: BarChart3, color: 'var(--color-ember)', desc: 'Skill gap analysis' },
  { id: 'opportunityMatcher', name: 'Opportunity Matcher', icon: Zap, color: 'var(--color-spark)', desc: 'Job matching engine' },
  { id: 'learningPathAdvisor', name: 'Learning Advisor', icon: BookOpen, color: 'var(--color-bloom)', desc: 'Personalized learning paths' },
  { id: 'portfolioScorer', name: 'Portfolio Scorer', icon: Trophy, color: 'var(--color-ember)', desc: 'Portfolio evaluation' },
  { id: 'verifier', name: 'Verifier', icon: Shield, color: 'var(--color-pulse)', desc: 'Proof verification' },
];

const TOOL_ICONS: Record<string, string> = {
  verify_github_repo: '\u{1F4BB}',
  verify_github_user: '\u{1F464}',
  verify_certificate: '\u{1F4DC}',
  web_search: '\u{1F50D}',
  fetch_webpage: '\u{1F310}',
  analyze_code: '\u{1F50D}',
  extract_skills: '\u{1F4CA}',
  analyze_portfolio: '\u{1F3AF}',
  check_url_safety: '\u{1F6E1}\uFE0F',
  validate_email: '\u{2709}\uFE0F',
  generate_embeddings: '\u{2728}',
  detect_language: '\u{1F4DD}',
};

export function AgentChat({ initialAgent = 'chat', onMessageSent }: AgentChatProps) {
  const { user } = useAuth();
  const { tier } = usePlan();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentAgent = AGENTS.find(a => a.id === selectedAgent) || AGENTS[0];
  const userId = user?.id || 'anon';

  const startNewConversation = useCallback(() => {
    const newConv = chatStore.newConversation(user?.id || null, selectedAgent);
    setConversation(newConv);
    setMessages([]);
    setConversationHistory([]);
    setInput('');
  }, [user, selectedAgent]);

  useEffect(() => {
    if (!conversation) startNewConversation();
  }, [conversation, startNewConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedAgent, conversation?.id]);

  const persistConversation = useCallback(
    async (conv: ChatConversation) => {
      await chatStore.save(conv, tier);
      setRefreshKey(k => k + 1);
    },
    [tier],
  );

  const handleSend = async () => {
    if (!input.trim() || isLoading || !conversation) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    onMessageSent?.(userMessage);

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    chatStore.appendMessage(conversation, { role: 'user', content: userMessage });
    if (conversation.title === 'New conversation') {
      conversation.title = chatStore.generateTitle(userMessage);
    }
    setConversation({ ...conversation });

    const newHistory = [...conversationHistory, { role: 'user', content: userMessage }];
    setConversationHistory(newHistory);

    try {
      const result = await api.agents.run(selectedAgent, userMessage, newHistory.slice(-10));

      const assistantMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: result.answer || 'I could not generate a response.',
        timestamp: new Date(),
        agentId: result.agentId,
        toolCalls: result.toolCalls,
        durationMs: result.durationMs,
        thinking: result.thinking,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: result.answer }]);
      chatStore.appendMessage(conversation, {
        role: 'assistant',
        content: result.answer,
        agentId: result.agentId,
        toolCalls: result.toolCalls,
        durationMs: result.durationMs,
        thinking: result.thinking,
      });
      setConversation({ ...conversation });
      await persistConversation(conversation);
    } catch (error) {
      const errorMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      chatStore.appendMessage(conversation, { role: 'assistant', content: errorMsg.content });
      setConversation({ ...conversation });
      await persistConversation(conversation);
    } finally {
      setIsLoading(false);
    }
  };

  const showLimitState = messages.length === 0;

  const handleSelectConversation = useCallback(
    async (c: ChatConversation) => {
      const full = await chatStore.get(c.id, userId, tier);
      if (!full) return;
      setConversation(full);
      setMessages(
        full.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          agentId: m.agentId,
          toolCalls: m.toolCalls,
          durationMs: m.durationMs,
          thinking: m.thinking,
        })),
      );
      setConversationHistory(full.messages.map(m => ({ role: m.role, content: m.content })));
      if (full.agentId) setSelectedAgent(full.agentId);
    },
    [userId, tier],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="flex h-full rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
      {sidebarOpen && (
        <div className="hidden md:flex">
          <ChatHistorySidebar
            activeId={conversation?.id || null}
            onSelect={handleSelectConversation}
            onNew={startNewConversation}
            refreshKey={refreshKey}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--color-surface-dim)]"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="relative">
              <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: currentAgent.color + '12' }}>
                <currentAgent.icon className="w-4.5 h-4.5" style={{ color: currentAgent.color }} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-surface)]" style={{ backgroundColor: 'var(--color-bloom)' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{currentAgent.name}</h3>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{currentAgent.desc}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAgentPicker(!showAgentPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all duration-200 border"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface-dim)',
              }}
            >
              Switch
              <ChevronDown className="w-3 h-3" />
            </button>

            {showAgentPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAgentPicker(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 rounded-[var(--radius-xl)] border overflow-hidden z-50" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-2xl)' }}>
                  <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Select Agent</p>
                  </div>
                  <div className="p-2 max-h-80 overflow-y-auto">
                    {AGENTS.map(agent => {
                      const Icon = agent.icon;
                      const isActive = agent.id === selectedAgent;
                      return (
                        <button
                          key={agent.id}
                          onClick={() => { setSelectedAgent(agent.id); setShowAgentPicker(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-all duration-150"
                          style={{ backgroundColor: isActive ? agent.color + '10' : 'transparent' }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: agent.color + '15' }}>
                            <Icon className="w-4 h-4" style={{ color: agent.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>{agent.name}</p>
                            <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{agent.desc}</p>
                          </div>
                          {isActive && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mb-4" style={{ backgroundColor: currentAgent.color + '10' }}>
                <currentAgent.icon className="w-7 h-7" style={{ color: currentAgent.color }} />
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>Ask {currentAgent.name}</h3>
              <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
                {currentAgent.desc}. I'll use specialized tools to give you the best insights.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {[
                  { text: 'Analyze my skills', icon: BarChart3 },
                  { text: 'Find opportunities', icon: Zap },
                  { text: 'Create a learning path', icon: BookOpen },
                  { text: 'Score my portfolio', icon: Trophy },
                ].map(s => (
                  <button
                    key={s.text}
                    onClick={() => setInput(s.text)}
                    className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] text-left text-sm transition-all duration-200 border"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = currentAgent.color; e.currentTarget.style.color = currentAgent.color; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                  >
                    <s.icon className="w-4 h-4 flex-shrink-0" style={{ color: currentAgent.color }} />
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: currentAgent.color + '12' }}>
                  <Bot className="w-4 h-4" style={{ color: currentAgent.color }} />
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>

                {message.toolCalls && message.toolCalls.length > 0 && message.role === 'assistant' && (
                  <div className="rounded-[var(--radius-md)] overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                      onClick={() => toggleToolExpand(message.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors"
                      style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3 h-3" />
                        <span>{message.toolCalls.length} tool{message.toolCalls.length > 1 ? 's' : ''} used</span>
                      </div>
                      <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: expandedTools[message.id] ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {expandedTools[message.id] && (
                      <div className="px-3 py-2 space-y-1.5" style={{ backgroundColor: 'var(--color-surface)' }}>
                        {message.toolCalls.map((tc, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            <span className="text-sm">{TOOL_ICONS[tc.tool] || '\u{1F527}'}</span>
                            <span className="font-mono font-medium truncate" style={{ color: 'var(--color-ink)' }}>{tc.tool}</span>
                            {tc.result?.success !== undefined && (
                              <span className="ml-auto flex-shrink-0">
                                {tc.result.success
                                  ? <span style={{ color: 'var(--color-bloom)' }}>✓</span>
                                  : <span style={{ color: 'var(--color-pulse)' }}>✗</span>}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {message.thinking && message.role === 'assistant' && (
                  <div className="rounded-[var(--radius-md)] overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                      onClick={() => toggleToolExpand(message.id + '-thinking')}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors"
                      style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3 h-3" />
                        <span>Reasoning</span>
                      </div>
                      <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: expandedTools[message.id + '-thinking'] ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>
                    {expandedTools[message.id + '-thinking'] && (
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
                    {message.durationMs && <span>{(message.durationMs / 1000).toFixed(1)}s</span>}
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                  <User className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: currentAgent.color + '12' }}>
                <Bot className="w-4 h-4" style={{ color: currentAgent.color }} />
              </div>
              <div className="rounded-[var(--radius-lg)] px-4 py-3 border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: currentAgent.color, animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: currentAgent.color, animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: currentAgent.color, animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    {currentAgent.name} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentAgent.name}...`}
              rows={1}
              className="flex-1 resize-none rounded-[var(--radius-lg)] px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-surface-dim)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-border)',
                outlineColor: currentAgent.color,
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-lg)] transition-all duration-200 disabled:opacity-40"
              style={{
                backgroundColor: input.trim() ? currentAgent.color : 'var(--color-surface-dim)',
                color: input.trim() ? 'white' : 'var(--color-text-tertiary)',
              }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
