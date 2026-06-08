'use client';

import { useState, useMemo } from 'react';
import type { ChartDataPoint } from '@/lib/visual-spec';

const CHART_COLORS = [
  'var(--color-bloom)',
  'var(--color-pulse)',
  'var(--color-ember)',
  'var(--color-spark)',
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];

interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  yAxisLabel?: string;
  annotations?: Array<{ label: string; value?: number; color?: string }>;
  size?: 'small' | 'medium' | 'large';
}

export function BarChart({ data, title, subtitle, yAxisLabel, annotations, size = 'medium' }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const maxValueWithBuffer = maxValue * 1.1;

  const height = size === 'small' ? 160 : size === 'large' ? 280 : 220;
  const barWidth = Math.max(16, Math.min(48, Math.floor(400 / data.length) - 8));

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

      <div className="relative" style={{ height }}>
        {yAxisLabel && (
          <div
            className="absolute -left-1 top-0 bottom-0 flex items-center"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            <span className="text-[9px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {yAxisLabel}
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ left: yAxisLabel ? 20 : 0 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <div key={pct} className="w-full flex items-center" style={{ borderBottom: '1px solid var(--color-border)', opacity: 0.5 }}>
              <span className="text-[8px] mr-1" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', minWidth: 24, textAlign: 'right' }}>
                {Math.round(maxValue * pct)}
              </span>
            </div>
          ))}
        </div>

        <div
          className="absolute bottom-0 flex items-end justify-center gap-1"
          style={{ left: yAxisLabel ? 24 : 0, right: 0, height: height - 20 }}
        >
          {data.map((item, i) => {
            const barHeight = Math.max(2, (item.value / maxValueWithBuffer) * (height - 30));
            const isHovered = hoveredIndex === i;
            const color = item.color || CHART_COLORS[i % CHART_COLORS.length];

            return (
              <div
                key={i}
                className="flex flex-col items-center group cursor-pointer relative"
                style={{ width: barWidth }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {isHovered && (
                  <div
                    className="absolute -top-8 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap z-10"
                    style={{
                      backgroundColor: 'var(--color-ink)',
                      color: 'var(--color-paper)',
                      fontFamily: 'var(--font-mono)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    {item.value}
                  </div>
                )}

                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: barHeight,
                    backgroundColor: color,
                    opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1,
                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />

                <span
                  className="text-[8px] mt-1 text-center leading-tight truncate w-full"
                  style={{ color: isHovered ? 'var(--color-ink)' : 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                >
                  {item.label.length > 8 ? item.label.slice(0, 8) + '...' : item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {annotations && annotations.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {annotations.map((ann, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ann.color || 'var(--color-bloom)' }} />
              <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>{ann.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
