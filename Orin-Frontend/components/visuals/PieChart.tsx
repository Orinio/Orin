'use client';

import { useState, useMemo } from 'react';
import type { ChartDataPoint } from '@/lib/visual-spec';

const PIE_COLORS = [
  'var(--color-bloom)',
  'var(--color-pulse)',
  'var(--color-ember)',
  'var(--color-spark)',
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];

interface PieChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  annotations?: Array<{ label: string; value?: number; color?: string }>;
  size?: 'small' | 'medium' | 'large';
  donut?: boolean;
}

export function PieChart({ data, title, subtitle, annotations, size = 'medium', donut = false }: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const radius = size === 'small' ? 60 : size === 'large' ? 100 : 80;
  const innerRadius = donut ? radius * 0.55 : 0;
  const center = radius + 8;
  const svgSize = (radius + 8) * 2;

  const slices = useMemo(() => {
    let startAngle = -Math.PI / 2;
    return data.map((item, i) => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const color = item.color || PIE_COLORS[i % PIE_COLORS.length];
      const isHovered = hoveredIndex === i;
      const r = radius + (isHovered ? 4 : 0);

      const x1 = center + r * Math.cos(startAngle);
      const y1 = center + r * Math.sin(startAngle);
      const x2 = center + r * Math.cos(endAngle - 0.01);
      const y2 = center + r * Math.sin(endAngle - 0.01);
      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      let path: string;
      if (donut) {
        const ix1 = center + innerRadius * Math.cos(startAngle);
        const iy1 = center + innerRadius * Math.sin(startAngle);
        const ix2 = center + innerRadius * Math.cos(endAngle - 0.01);
        const iy2 = center + innerRadius * Math.sin(endAngle - 0.01);
        path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      } else {
        path = `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }

      const pct = Math.round((item.value / total) * 100);
      startAngle = endAngle;
      return { path, color, isHovered, item, pct };
    });
  }, [data, total, radius, innerRadius, center, hoveredIndex]);

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

      <div className="flex items-center gap-4">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              opacity={hoveredIndex !== null && !slice.isHovered ? 0.5 : 1}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ filter: slice.isHovered ? 'brightness(1.1)' : 'none' }}
            />
          ))}
          {donut && (
            <text
              x={center}
              y={center}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--color-ink)"
              fontSize="14"
              fontWeight="bold"
              fontFamily="var(--font-mono)"
            >
              {hoveredIndex !== null ? slices[hoveredIndex].pct + '%' : total}
            </text>
          )}
        </svg>

        <div className="flex flex-col gap-1">
          {slices.map((slice, i) => (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: slice.color,
                  transform: slice.isHovered ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              <span
                className="text-[10px] transition-colors duration-200"
                style={{
                  color: slice.isHovered ? 'var(--color-ink)' : 'var(--color-text-tertiary)',
                  fontWeight: slice.isHovered ? 600 : 400,
                }}
              >
                {slice.item.label}
              </span>
              <span
                className="text-[9px] font-mono transition-colors duration-200"
                style={{ color: slice.isHovered ? 'var(--color-ink)' : 'var(--color-text-tertiary)' }}
              >
                {slice.pct}%
              </span>
            </div>
          ))}
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
