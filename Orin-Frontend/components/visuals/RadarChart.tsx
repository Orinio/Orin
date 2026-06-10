'use client';

import { useState, useMemo } from 'react';

interface RadarChartProps {
  data: Array<{ label: string; value: number; maxValue?: number }>;
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
}

export function RadarChart({ data, title, subtitle, size = 'medium' }: RadarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dimension = size === 'small' ? 160 : size === 'large' ? 280 : 220;
  const center = dimension / 2;
  const maxRadius = center - 30;
  const sides = data.length;
  const angleStep = (2 * Math.PI) / sides;

  const maxValues = useMemo(() => data.map(d => d.maxValue || 100), [data]);

  const getPoint = (index: number, value: number, maxValue: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const ratio = Math.min(value / maxValue, 1);
    return {
      x: center + maxRadius * ratio * Math.cos(angle),
      y: center + maxRadius * ratio * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const labelRadius = maxRadius + 18;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  // Build polygon path for data
  const dataPoints = data.map((d, i) => getPoint(i, d.value, maxValues[i]));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid levels
  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <div>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>}
        </div>
      )}
      <div className="flex justify-center">
        <svg width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
          {/* Grid circles */}
          {levels.map((level, li) => {
            const points = Array.from({ length: sides }, (_, i) => {
              const angle = angleStep * i - Math.PI / 2;
              return `${center + maxRadius * level * Math.cos(angle)},${center + maxRadius * level * Math.sin(angle)}`;
            }).join(' ');
            return (
              <polygon
                key={li}
                points={points}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.5"
                opacity={0.5}
              />
            );
          })}

          {/* Axis lines */}
          {data.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={center + maxRadius * Math.cos(angle)}
                y2={center + maxRadius * Math.sin(angle)}
                stroke="var(--color-border)"
                strokeWidth="0.5"
                opacity={0.3}
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
          />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 6 : 4}
                fill="rgba(59, 130, 246, 0.9)"
                stroke="white"
                strokeWidth="2"
                style={{ transition: 'r 0.15s', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {hoveredIndex === i && (
                <g>
                  <rect
                    x={p.x - 30}
                    y={p.y - 28}
                    width="60"
                    height="20"
                    rx="4"
                    fill="var(--color-ink)"
                  />
                  <text
                    x={p.x}
                    y={p.y - 15}
                    textAnchor="middle"
                    fill="var(--color-surface)"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {data[i].label}: {data[i].value}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Labels */}
          {data.map((d, i) => {
            const lp = getLabelPoint(i);
            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontWeight="500"
                fill="var(--color-text-secondary)"
              >
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
