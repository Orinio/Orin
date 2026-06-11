'use client';

import { PanelLeft, PanelRight, Sparkles } from 'lucide-react';
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
      className="flex-shrink-0 flex items-center justify-between h-14 px-4 relative z-20"
      style={{
        borderBottom: '1px solid #e5e0d6',
        backgroundColor: '#faf9f5',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
          style={{ color: '#3d3a35' }}
          title="Toggle conversation history"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="h-5 w-px" style={{ backgroundColor: '#e5e0d6' }} />

        {/* Brand */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#c96442' }} />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-xs font-semibold truncate"
              style={{ color: '#1a1a1a', fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {title}
            </span>
            <span
              className="text-[10px] truncate hidden sm:block"
              style={{ color: '#b0aaa0', fontFamily: 'var(--font-mono)' }}
            >
              AI Career Agent
            </span>
          </div>
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
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: '#f0ece3',
            color: '#5b5950',
            fontFamily: 'var(--font-mono)',
            border: '1px solid #e5e0d6',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentModel.badgeColor || '#c96442' }}
          />
          {currentModel.name.split(' ').slice(0, 2).join(' ')}
        </div>

        {/* Activity toggle */}
        <button
          onClick={onToggleActivity}
          className="relative p-2 rounded-xl transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
          style={{ color: '#3d3a35' }}
          title="Toggle activity panel"
        >
          <PanelRight className="w-4 h-4" />
          {activityCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold px-1"
              style={{
                backgroundColor: '#c96442',
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
