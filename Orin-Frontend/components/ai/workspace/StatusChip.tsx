'use client';

import { Loader2, Brain, Wrench, CheckCircle2, AlertCircle, Zap, Pause } from 'lucide-react';

export type AgentState = 'idle' | 'thinking' | 'planning' | 'using_tool' | 'generating' | 'error' | 'paused';

interface StatusChipProps {
  state: AgentState;
  label?: string;
  className?: string;
}

const STATE_CONFIG: Record<AgentState, {
  icon: typeof Loader2;
  color: string;
  bgColor: string;
  borderColor: string;
  defaultLabel: string;
  animate: boolean;
}> = {
  idle: {
    icon: Pause,
    color: 'var(--color-text-tertiary)',
    bgColor: 'var(--color-surface-dim)',
    borderColor: 'var(--color-border)',
    defaultLabel: 'Idle',
    animate: false,
  },
  thinking: {
    icon: Brain,
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
    defaultLabel: 'Thinking',
    animate: true,
  },
  planning: {
    icon: Zap,
    color: 'var(--color-ember)',
    bgColor: 'rgba(246, 146, 38, 0.08)',
    borderColor: 'rgba(246, 146, 38, 0.2)',
    defaultLabel: 'Planning',
    animate: true,
  },
  using_tool: {
    icon: Wrench,
    color: 'var(--color-pulse)',
    bgColor: 'rgba(238, 66, 102, 0.08)',
    borderColor: 'rgba(238, 66, 102, 0.2)',
    defaultLabel: 'Using tool',
    animate: true,
  },
  generating: {
    icon: Zap,
    color: 'var(--color-bloom)',
    bgColor: 'rgba(11, 171, 119, 0.08)',
    borderColor: 'rgba(11, 171, 119, 0.2)',
    defaultLabel: 'Generating',
    animate: true,
  },
  error: {
    icon: AlertCircle,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    defaultLabel: 'Error',
    animate: false,
  },
  paused: {
    icon: Pause,
    color: 'var(--color-text-tertiary)',
    bgColor: 'var(--color-surface-dim)',
    borderColor: 'var(--color-border)',
    defaultLabel: 'Paused',
    animate: false,
  },
};

export default function StatusChip({ state, label, className = '' }: StatusChipProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.animate ? Loader2 : config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300 ${className}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <Icon
        className={`w-3 h-3 flex-shrink-0 ${config.animate ? 'animate-spin' : ''}`}
      />
      <span>{displayLabel}</span>
      {state === 'thinking' && (
        <span className="flex items-center gap-0.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-0.5 h-0.5 rounded-full animate-pulse"
              style={{ backgroundColor: config.color, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </span>
      )}
    </div>
  );
}
