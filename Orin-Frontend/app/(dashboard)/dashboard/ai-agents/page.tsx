'use client';

import { useState } from 'react';
import { AgentDashboard } from '@/components/ai/AgentDashboard';
import { AgentChat } from '@/components/ai/AgentChat';
import { BoundedAgentChat } from '@/components/ai/BoundedAgentChat';
import { usePlan } from '@/lib/plan-context';
import { useUsage } from '@/lib/use-usage';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { CareerAnalysisWorkflow } from '@/components/ai/WorkflowVisualization';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MessageSquare, BarChart3, GitBranch, Sparkles } from 'lucide-react';

type Tab = 'chat' | 'dashboard' | 'workflows';

export default function AIAgentsPage() {
  return (
    <ErrorBoundary>
      <AIAgentsContent />
    </ErrorBoundary>
  );
}

function AIAgentsContent() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { isFree, isPro } = usePlan();
  const usage = useUsage();
  const aiInfo = usage.get('ai_messages');

  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare, desc: 'Talk to specialized agents' },
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3, desc: 'Browse all agents & tools' },
    { id: 'workflows' as const, label: 'Workflows', icon: GitBranch, desc: 'Multi-agent pipelines' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {isFree && activeTab === 'chat' && !aiInfo.isExhausted && aiInfo.percent < 60 && (
        <div className="mb-4">
          <UpgradePrompt variant="inline" metric="ai_messages" reason="feature" compact />
        </div>
      )}

      {/* Header */}
      <header className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>AI Agents</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Your specialized AI team for career development
              {isFree && !aiInfo.isUnlimited && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
                  Free · {aiInfo.used} / {aiInfo.limit}
                </span>
              )}
              {isPro && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
                  Pro · unlimited
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-[var(--radius-lg)] mb-5" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
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
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full">
            <BoundedAgentChat />
          </div>
        )}
        {activeTab === 'dashboard' && (
          <div className="h-full overflow-y-auto">
            <AgentDashboard />
          </div>
        )}
        {activeTab === 'workflows' && (
          <div className="h-full overflow-y-auto">
            <CareerAnalysisWorkflow />
          </div>
        )}
      </div>
    </div>
  );
}
