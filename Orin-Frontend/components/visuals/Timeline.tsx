'use client';

import { useState } from 'react';
import type { TimelineEntry } from '@/lib/visual-spec';

interface TimelineProps {
  entries: TimelineEntry[];
  title?: string;
  subtitle?: string;
}

export function Timeline({ entries, title, subtitle }: TimelineProps) {
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

        {entries.map((entry, i) => {
          const isHovered = hoveredIndex === i;
          const color = entry.color || 'var(--color-bloom)';

          return (
            <div
              key={i}
              className="relative mb-4 last:mb-0 cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className="absolute -left-6 top-1 w-6 h-6 flex items-center justify-center rounded-full text-[10px] transition-all duration-200"
                style={{
                  backgroundColor: isHovered ? color : 'var(--color-paper)',
                  border: `2px solid ${color}`,
                  color: isHovered ? 'var(--color-paper)' : color,
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {entry.icon || '\u2022'}
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
                    {entry.title}
                  </span>
                </div>

                {entry.date && (
                  <span className="text-[9px] mt-0.5 block" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {entry.date}
                  </span>
                )}

                {entry.description && isHovered && (
                  <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {entry.description}
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
