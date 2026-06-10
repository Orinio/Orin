'use client';

import { useState } from 'react';

interface HeatMapProps {
  data: {
    rows: string[];
    columns: string[];
    values: number[][];
    minLabel?: string;
    maxLabel?: string;
  };
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
}

function getHeatColor(value: number, min: number, max: number): string {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  if (ratio < 0.25) return 'rgba(59, 130, 246, 0.2)';
  if (ratio < 0.5) return 'rgba(59, 130, 246, 0.4)';
  if (ratio < 0.75) return 'rgba(59, 130, 246, 0.65)';
  return 'rgba(59, 130, 246, 0.9)';
}

export function HeatMap({ data, title, subtitle, size = 'medium' }: HeatMapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const allValues = data.values.flat();
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  const cellSize = size === 'small' ? 28 : size === 'large' ? 44 : 36;

  return (
    <div>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>}
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex" style={{ marginLeft: `${cellSize + 8}px` }}>
            {data.columns.map((col, ci) => (
              <div
                key={ci}
                className="text-center text-[9px] font-medium truncate"
                style={{ width: cellSize, color: 'var(--color-text-tertiary)', padding: '0 2px' }}
              >
                {col}
              </div>
            ))}
          </div>
          {/* Rows */}
          {data.values.map((row, ri) => (
            <div key={ri} className="flex items-center">
              <div
                className="text-[9px] font-medium truncate text-right pr-2"
                style={{ width: cellSize + 8, color: 'var(--color-text-tertiary)' }}
              >
                {data.rows[ri]}
              </div>
              {row.map((val, ci) => (
                <div
                  key={ci}
                  className="relative flex items-center justify-center rounded-sm transition-transform cursor-default"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: getHeatColor(val, min, max),
                    transform: hoveredCell?.row === ri && hoveredCell?.col === ci ? 'scale(1.15)' : 'scale(1)',
                    zIndex: hoveredCell?.row === ri && hoveredCell?.col === ci ? 10 : 1,
                  }}
                  onMouseEnter={() => setHoveredCell({ row: ri, col: ci })}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <span className="text-[8px] font-bold" style={{ color: 'var(--color-ink)' }}>
                    {val}
                  </span>
                  {hoveredCell?.row === ri && hoveredCell?.col === ci && (
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap z-20"
                      style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-surface)' }}
                    >
                      {data.rows[ri]} × {data.columns[ci]}: {val}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>{data.minLabel || min}</span>
        <div className="flex gap-0.5">
          {[0.2, 0.4, 0.65, 0.9].map((opacity, i) => (
            <div key={i} className="w-4 h-2 rounded-sm" style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }} />
          ))}
        </div>
        <span className="text-[9px]" style={{ color: 'var(--color-text-tertiary)' }}>{data.maxLabel || max}</span>
      </div>
    </div>
  );
}
