'use client';

import { useState } from 'react';
import { AgentDashboard } from '@/components/ai/AgentDashboard';
import { AgentChat } from '@/components/ai/AgentChat';
import { CareerAnalysisWorkflow } from '@/components/ai/WorkflowVisualization';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MessageSquare, BarChart3, GitBranch } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">
          AI Agents Team
        </h1>
        <p className="text-sm text-[var(--color-neutral-text-secondary)]">
          Meet your specialized AI agents for career development
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'chat'
              ? 'bg-[var(--color-primary-emerald)] text-white'
              : 'bg-[var(--color-neutral-surface)] text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'dashboard'
              ? 'bg-[var(--color-primary-emerald)] text-white'
              : 'bg-[var(--color-neutral-surface)] text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'workflows'
              ? 'bg-[var(--color-primary-emerald)] text-white'
              : 'bg-[var(--color-neutral-surface)] text-[var(--color-neutral-text-secondary)] hover:bg-[var(--color-neutral-surface-alt)]'
          }`}
        >
          <GitBranch className="h-4 w-4" />
          Workflows
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full">
            <AgentChat />
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
