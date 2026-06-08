'use client';

import { useState } from 'react';
import type { FlowStep } from '@/lib/visual-spec';

interface FlowchartProps {
  steps: FlowStep[];
  title?: string;
  subtitle?: string;
}

const statusColors: Record<string, string> = {
  complete: 'var(--color-bloom)',
  current: '#f59e0b',
  pending: 'var(--color-text-tertiary)',
  error: 'var(--color-ember)',
};

const statusIcons: Record<string, string> = {
  complete: '\u2713',
  current: '\u25B6',
  pending: '\u25CB',
  error: '\u2717',
};

export function Flowchart({ steps, title, subtitle }: FlowchartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h4 className="text-sm font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>
          )}
        </div>
      )}

      <div className="relative pl-6">
        <div
          className="absolute left-3 top-2 bottom-2 w-px"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        {steps.map((step, i) => {
          const isHovered = hoveredIndex === i;
          const color = statusColors[step.status] || 'var(--color-text-tertiary)';
          const icon = step.icon || statusIcons[step.status] || '\u25CB';

          return (
            <div
              key={step.id}
              className="relative mb-4 last:mb-0 cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="absolute -left-6 top-1 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200"
                style={{
                  backgroundColor: isHovered ? color : 'var(--color-paper)',
                  border: `2px solid ${color}`,
                  color: isHovered ? 'var(--color-paper)' : color,
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {icon}
              </div>

              <div
                className="rounded-lg p-3 transition-all duration-200"
                style={{
                  backgroundColor: isHovered ? 'var(--color-surface)' : 'transparent',
                  border: isHovered ? '1px solid var(--color-border)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-ink)' }}>
                    {step.label}
                  </span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full font-mono"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {step.status}
                  </span>
                </div>

                {step.description && isHovered && (
                  <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
