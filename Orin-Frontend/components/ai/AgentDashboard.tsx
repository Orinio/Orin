'use client';

import { useState, useEffect } from 'react';
import { api, type Agent, type Tool, type AgentResult } from '@/lib/api-client';
import {
  Bot,
  Wrench,
  Workflow,
  Play,
  Loader2,
  Brain,
  Clock,
  Zap,
  ChevronRight,
  Sparkles,
  Target,
  BarChart3,
  BookOpen,
  Trophy,
  Shield,
} from 'lucide-react';

const AGENT_ICONS: Record<string, typeof Bot> = {
  chat: Bot,
  coach: Target,
  skillAnalyst: BarChart3,
  opportunityMatcher: Zap,
  learningPathAdvisor: BookOpen,
  portfolioScorer: Trophy,
  verifier: Shield,
};

const AGENT_COLORS: Record<string, string> = {
  chat: 'var(--color-bloom)',
  coach: 'var(--color-pulse)',
  skillAnalyst: 'var(--color-ember)',
  opportunityMatcher: 'var(--color-spark)',
  learningPathAdvisor: 'var(--color-bloom)',
  portfolioScorer: 'var(--color-ember)',
  verifier: 'var(--color-pulse)',
};

export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'tools' | 'workflows'>('agents');

  useEffect(() => {
    loadAgentsAndTools();
  }, []);

  async function loadAgentsAndTools() {
    const [agentsData, toolsData] = await Promise.all([api.agents.list(), api.tools.list()]);
    setAgents(agentsData);
    setTools(toolsData);
  }

  async function handleRunAgent() {
    if (!selectedAgent || !query.trim()) return;
    setIsLoading(true);
    try {
      const result = await api.agents.run(selectedAgent.id, query);
      setResult(result);
    } catch (error) {
      console.error('Failed to run agent:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCareerAnalysis() {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const data = await api.workflows.careerAnalysis(query);
      const results = data?.results ?? {};
      const entries = Object.values(results);
      const combinedResult: AgentResult = {
        agentId: 'career-analysis',
        answer: entries.map(r => r?.answer ?? '').join('\n\n'),
        thinking: entries.map(r => r?.thinking ?? '').join('\n'),
        toolCalls: entries.flatMap(r => r?.toolCalls ?? []),
        iterations: entries.reduce((sum, r) => sum + (r?.iterations ?? 0), 0),
        tokensUsed: entries.reduce((sum, r) => sum + (r?.tokensUsed ?? 0), 0),
        durationMs: entries.reduce((sum, r) => sum + (r?.durationMs ?? 0), 0),
      };
      setResult(combinedResult);
    } catch (error) {
      console.error('Failed to run career analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const tabs = [
    { id: 'agents' as const, label: 'Agents', count: agents.length, icon: Bot },
    { id: 'tools' as const, label: 'Tools', count: tools.length, icon: Wrench },
    { id: 'workflows' as const, label: 'Workflows', count: 1, icon: Workflow },
  ];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[var(--radius-lg)]" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 flex-1 justify-center"
              style={{
                backgroundColor: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-ink)' : 'var(--color-text-tertiary)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: isActive ? 'var(--color-primary-soft)' : 'var(--color-surface)', color: isActive ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Agent List */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Available Agents</p>
            {agents.map(agent => {
              const Icon = AGENT_ICONS[agent.id] || Bot;
              const color = AGENT_COLORS[agent.id] || 'var(--color-bloom)';
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full text-left p-3.5 rounded-[var(--radius-lg)] transition-all duration-200 border"
                  style={{
                    backgroundColor: isSelected ? color + '08' : 'var(--color-surface)',
                    borderColor: isSelected ? color : 'var(--color-border)',
                    boxShadow: isSelected ? `0 0 0 1px ${color}20` : 'var(--shadow-xs)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '12' }}>
                      <Icon className="w-4.5 h-4.5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{agent.name}</p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>{agent.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: isSelected ? color : 'var(--color-mist)' }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2 ml-12">
                    {agent.tools.slice(0, 2).map(tool => (
                      <span key={tool} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-tertiary)' }}>
                        {tool}
                      </span>
                    ))}
                    {agent.tools.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-tertiary)' }}>
                        +{agent.tools.length - 2}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Agent Details */}
          <div className="lg:col-span-2 rounded-[var(--radius-xl)] border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}>
            {selectedAgent ? (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: (AGENT_COLORS[selectedAgent.id] || 'var(--color-bloom)') + '12' }}>
                      {(() => { const I = AGENT_ICONS[selectedAgent.id] || Bot; return <I className="w-5 h-5" style={{ color: AGENT_COLORS[selectedAgent.id] || 'var(--color-bloom)' }} />; })()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>{selectedAgent.name}</h2>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{selectedAgent.model}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-neutral-text-secondary)' }}>{selectedAgent.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.tools.map(tool => (
                    <span key={tool} className="text-[11px] px-2 py-1 rounded-full font-medium border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-dim)' }}>
                      {tool}
                    </span>
                  ))}
                </div>

                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your query for this agent..."
                  className="w-full rounded-[var(--radius-lg)] px-4 py-3 text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}
                  rows={4}
                />

                <button
                  onClick={handleRunAgent}
                  disabled={isLoading || !query.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold transition-all duration-200 disabled:opacity-40"
                  style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isLoading ? 'Running...' : 'Run Agent'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                  <Sparkles className="w-7 h-7" style={{ color: 'var(--color-mist)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>Select an agent to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Available Tools ({tools.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map(tool => (
              <div key={tool.name} className="p-4 rounded-[var(--radius-lg)] border transition-all duration-200 hover:shadow-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
                  <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>{tool.name}</h3>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-tertiary)' }}>{tool.description}</p>
                <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-bloom)' }}>
                  {tool.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="rounded-[var(--radius-xl)] border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
              <Workflow className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Career Analysis Workflow</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Multi-agent pipeline for comprehensive career insights</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {['Skill Analysis', 'Portfolio Scoring', 'Opportunity Matching', 'Learning Path', 'Career Coaching'].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>{step}</span>
                {i < 4 && <span style={{ color: 'var(--color-mist)' }}>\u2192</span>}
              </span>
            ))}
          </div>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your career goals and current skills..."
            className="w-full rounded-[var(--radius-lg)] px-4 py-3 text-sm resize-none transition-all duration-200 focus:outline-none focus:ring-2 mb-4"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-ink)' }}
            rows={4}
          />

          <button
            onClick={handleCareerAnalysis}
            disabled={isLoading || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-lg)] text-sm font-semibold transition-all duration-200 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isLoading ? 'Running Analysis...' : 'Run Career Analysis'}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="rounded-[var(--radius-xl)] border p-6 space-y-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>Result</h3>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Tools Used', value: (result.toolCalls ?? []).length, color: 'var(--color-bloom)', icon: Wrench },
              { label: 'Iterations', value: result.iterations ?? 0, color: 'var(--color-ember)', icon: Target },
              { label: 'Tokens', value: result.tokensUsed ?? 0, color: 'var(--color-pulse)', icon: Zap },
              { label: 'Duration', value: `${((result.durationMs ?? 0) / 1000).toFixed(1)}s`, color: 'var(--color-spark)', icon: Clock },
            ].map(stat => (
              <div key={stat.label} className="p-3 rounded-[var(--radius-lg)] text-center" style={{ backgroundColor: stat.color + '08' }}>
                <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Thinking */}
          {result.thinking && (
            <div className="p-4 rounded-[var(--radius-lg)] border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4" style={{ color: 'var(--color-ember)' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Reasoning</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-neutral-text-secondary)' }}>{result.thinking}</p>
            </div>
          )}

          {/* Answer */}
          <div className="p-4 rounded-[var(--radius-lg)]" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-bloom)' }}>Answer</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-ink)' }}>{result.answer}</p>
          </div>

          {/* Tool Calls */}
          {(result.toolCalls ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Tool Calls</p>
              <div className="space-y-1.5">
                {(result.toolCalls ?? []).map((tc, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                    <Wrench className="w-3 h-3" style={{ color: 'var(--color-bloom)' }} />
                    <span className="font-mono font-medium" style={{ color: 'var(--color-ink)' }}>{tc.tool}</span>
                    <span className="truncate flex-1" style={{ color: 'var(--color-text-tertiary)' }}>{JSON.stringify(tc.args).substring(0, 80)}...</span>
                    {tc.result?.success !== undefined && (
                      tc.result.success
                        ? <span style={{ color: 'var(--color-bloom)' }}>\u2713</span>
                        : <span style={{ color: 'var(--color-pulse)' }}>\u2717</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
