'use client';

import { PanelLeft, PanelRight, Cpu, Sparkles, ChevronDown } from 'lucide-react';
import StatusChip, { type AgentState } from './StatusChip';
import { CHAT_MODELS } from '@/components/ai/ChatInput';

interface ProjectHeaderProps {
  title: string;
  agentState: AgentState;
  agentLabel?: string;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onToggleSidebar: () => void;
  onToggleActivity: () => void;
  activityCount: number;
  isStreaming: boolean;
}

export default function ProjectHeader({
  title,
  agentState,
  agentLabel,
  selectedModel,
  onModelChange,
  onToggleSidebar,
  onToggleActivity,
  activityCount,
  isStreaming,
}: ProjectHeaderProps) {
  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) || CHAT_MODELS[0];

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between h-12 px-3"
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: 'var(--color-ink)' }}
          title="Toggle conversation history"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

        <div className="flex items-center gap-2 min-w-0">
          <Cpu className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
          <span
            className="text-xs font-semibold truncate hidden sm:inline"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* Center — Status */}
      <div className="flex items-center gap-2">
        <StatusChip state={agentState} label={agentLabel} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Model badge */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]"
          style={{
            backgroundColor: 'var(--color-surface-dim)',
            color: currentModel.badgeColor || 'var(--color-mist)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentModel.badgeColor || 'var(--color-bloom)' }}
          />
          {currentModel.name.split(' ').slice(0, 2).join(' ')}
        </div>

        {/* Activity toggle */}
        <button
          onClick={onToggleActivity}
          className="relative p-1.5 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: 'var(--color-ink)' }}
          title="Toggle activity panel"
        >
          <PanelRight className="w-4 h-4" />
          {activityCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{
                backgroundColor: 'var(--color-pulse)',
                color: 'white',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {activityCount > 9 ? '9+' : activityCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
