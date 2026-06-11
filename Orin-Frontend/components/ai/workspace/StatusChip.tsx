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
    color: '#b0aaa0',
    bgColor: '#f0ece3',
    borderColor: '#e5e0d6',
    defaultLabel: 'Idle',
    animate: false,
  },
  thinking: {
    icon: Brain,
    color: '#c96442',
    bgColor: 'rgba(201,100,66,0.08)',
    borderColor: 'rgba(201,100,66,0.2)',
    defaultLabel: 'Thinking',
    animate: true,
  },
  planning: {
    icon: Zap,
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.08)',
    borderColor: 'rgba(139,92,246,0.2)',
    defaultLabel: 'Planning',
    animate: true,
  },
  using_tool: {
    icon: Wrench,
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
    defaultLabel: 'Using tool',
    animate: true,
  },
  generating: {
    icon: Zap,
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.2)',
    defaultLabel: 'Generating',
    animate: true,
  },
  error: {
    icon: AlertCircle,
    color: '#dc2626',
    bgColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
    defaultLabel: 'Error',
    animate: false,
  },
  paused: {
    icon: Pause,
    color: '#b0aaa0',
    bgColor: '#f0ece3',
    borderColor: '#e5e0d6',
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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${className}`}
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
