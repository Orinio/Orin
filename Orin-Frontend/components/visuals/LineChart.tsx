'use client';

import { useState, useMemo } from 'react';
import type { ChartDataPoint } from '@/lib/visual-spec';

interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  yAxisLabel?: string;
  annotations?: Array<{ label: string; value?: number; color?: string }>;
  size?: 'small' | 'medium' | 'large';
}

export function LineChart({ data, title, subtitle, yAxisLabel, annotations, size = 'medium' }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const maxValueWithBuffer = maxValue * 1.1;

  const height = size === 'small' ? 160 : size === 'large' ? 280 : 220;
  const width = 400;
  const padding = { top: 16, right: 16, bottom: 32, left: yAxisLabel ? 40 : 32 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    return data.map((item, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - (item.value / maxValueWithBuffer) * chartHeight;
      return { x, y, ...item };
    });
  }, [data, maxValueWithBuffer, chartWidth, chartHeight, padding]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${padding.top + chartHeight} L ${first.x} ${padding.top + chartHeight} Z`;
  }, [linePath, points, chartHeight, padding]);

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
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-bloom)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-bloom)" stopOpacity="0" />
            </linearGradient>
          </defs>

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

          <path d={areaPath} fill="url(#lineAreaGradient)" />

          <path
            d={linePath}
            fill="none"
            stroke="var(--color-bloom)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : 3}
                  fill="var(--color-paper)"
                  stroke="var(--color-bloom)"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {isHovered && (
                  <>
                    <line
                      x1={p.x}
                      y1={padding.top}
                      x2={p.x}
                      y2={padding.top + chartHeight}
                      stroke="var(--color-bloom)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.5"
                    />
                    <rect
                      x={p.x - 24}
                      y={p.y - 24}
                      width={48}
                      height={16}
                      rx={4}
                      fill="var(--color-ink)"
                    />
                    <text
                      x={p.x}
                      y={p.y - 13}
                      textAnchor="middle"
                      fill="var(--color-paper)"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                    >
                      {p.value}
                    </text>
                    <text
                      x={p.x}
                      y={padding.top + chartHeight + 12}
                      textAnchor="middle"
                      fill="var(--color-ink)"
                      fontSize="8"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                    >
                      {p.label.length > 6 ? p.label.slice(0, 6) + '..' : p.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {hoveredIndex === null && points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fill="var(--color-text-tertiary)"
              fontSize="8"
              fontFamily="var(--font-mono)"
            >
              {p.label.length > 6 ? p.label.slice(0, 6) + '..' : p.label}
            </text>
          ))}
        </svg>
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
