'use client';

import { useState } from 'react';
import type { CardData } from '@/lib/visual-spec';

interface CardsProps {
  cards: CardData[];
  title?: string;
  subtitle?: string;
}

const colorMap: Record<string, string> = {
  bloom: 'var(--color-bloom)',
  pulse: 'var(--color-pulse)',
  ember: 'var(--color-ember)',
  spark: 'var(--color-spark)',
};

export function Cards({ cards, title, subtitle }: CardsProps) {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, i) => {
          const isHovered = hoveredIndex === i;
          const accent = colorMap[card.color || ''] || 'var(--color-bloom)';

          return (
            <div
              key={i}
              className="rounded-xl p-4 cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: 'var(--color-paper)',
                border: `1px solid ${isHovered ? accent : 'var(--color-border)'}`,
                boxShadow: isHovered ? `0 8px 24px ${accent}15` : 'none',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2 mb-2">
                {card.icon && <span className="text-lg">{card.icon}</span>}
                <span className="text-[11px] font-bold" style={{ color: 'var(--color-ink)' }}>
                  {card.title}
                </span>
              </div>

              <div className="mb-1">
                <span className="text-xl font-bold font-mono" style={{ color: accent }}>
                  {card.value}
                </span>
              </div>

              {card.subtitle && (
                <p className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {card.subtitle}
                </p>
              )}

              {card.trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{
                      color: card.trend.direction === 'up' ? 'var(--color-bloom)' :
                             card.trend.direction === 'down' ? 'var(--color-ember)' :
                             'var(--color-text-tertiary)',
                    }}
                  >
                    {card.trend.direction === 'up' ? '\u2191' : card.trend.direction === 'down' ? '\u2193' : '\u2192'}
                    {card.trend.value}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
