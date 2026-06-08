'use client';

import { useState, useMemo } from 'react';
import type { ChartDataPoint } from '@/lib/visual-spec';

interface ScatterPlotProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  size?: 'small' | 'medium' | 'large';
}

export function ScatterPlot({ data, title, subtitle, xAxisLabel, yAxisLabel, size = 'medium' }: ScatterPlotProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);

  const height = size === 'small' ? 160 : size === 'large' ? 280 : 220;
  const width = 400;
  const padding = { top: 16, right: 16, bottom: xAxisLabel ? 36 : 24, left: yAxisLabel ? 44 : 32 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    return data.map((item, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - (item.value / maxValue) * chartHeight;
      return { x, y, ...item };
    });
  }, [data, maxValue, chartWidth, chartHeight, padding]);

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

      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + chartHeight - pct * chartHeight;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
                <text
                  x={padding.left - 4}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--color-text-tertiary)"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                >
                  {Math.round(maxValue * pct)}
                </text>
              </g>
            );
          })}

          {xAxisLabel && (
            <text
              x={width / 2}
              y={height - 4}
              textAnchor="middle"
              fill="var(--color-text-tertiary)"
              fontSize="9"
            >
              {xAxisLabel}
            </text>
          )}
          {yAxisLabel && (
            <text
              x={8}
              y={height / 2}
              textAnchor="middle"
              fill="var(--color-text-tertiary)"
              fontSize="9"
              transform={`rotate(-90, 8, ${height / 2})`}
            >
              {yAxisLabel}
            </text>
          )}

          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                {isHovered && (
                  <circle cx={p.x} cy={p.y} r={10} fill="var(--color-bloom)" opacity="0.1" className="animate-pulse" />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={p.color || 'var(--color-bloom)'}
                  opacity={hoveredIndex !== null && !isHovered ? 0.4 : 0.85}
                  stroke="var(--color-paper)"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {isHovered && (
                  <>
                    <text
                      x={p.x}
                      y={p.y - 14}
                      textAnchor="middle"
                      fill="var(--color-ink)"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                    >
                      {p.value}
                    </text>
                    <text
                      x={p.x}
                      y={p.y + 16}
                      textAnchor="middle"
                      fill="var(--color-text-tertiary)"
                      fontSize="8"
                      fontFamily="var(--font-mono)"
                    >
                      {p.label.length > 10 ? p.label.slice(0, 10) + '..' : p.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
