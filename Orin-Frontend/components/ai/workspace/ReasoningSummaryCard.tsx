'use client';

import { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Clock } from 'lucide-react';

interface ReasoningSummaryCardProps {
  content: string;
  durationMs?: number;
  className?: string;
}

export default function ReasoningSummaryCard({ content, durationMs, className = '' }: ReasoningSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;

  const preview = content.length > 120 ? content.slice(0, 120) + '...' : content;

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-200 ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
      >
        <Brain className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6366f1' }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider flex-shrink-0"
          style={{ color: '#6366f1', fontFamily: 'var(--font-mono)' }}
        >
          Reasoning
        </span>
        {!expanded && (
          <span
            className="text-[11px] flex-1 truncate"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {preview}
          </span>
        )}
        {durationMs !== undefined && (
          <span
            className="text-[10px] flex-shrink-0 flex items-center gap-1 opacity-40"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Clock className="w-2.5 h-2.5" />
            {(durationMs / 1000).toFixed(1)}s
          </span>
        )}
        {expanded
          ? <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-30" />
          : <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-30" />
        }
      </button>
      {expanded && (
        <div
          className="px-3 pb-3 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto"
          style={{
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '8px',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
