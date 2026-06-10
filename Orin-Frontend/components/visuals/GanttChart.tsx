'use client';

import { useState } from 'react';

interface GanttChartProps {
  data: Array<{ id: string; label: string; start: string; end: string; progress?: number; color?: string; group?: string }>;
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
}

const COLORS = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(236, 72, 153, 0.8)',
];

export function GanttChart({ data, title, subtitle }: GanttChartProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const allDates = data.flatMap(d => [new Date(d.start).getTime(), new Date(d.end).getTime()]);
  const minTime = Math.min(...allDates);
  const maxTime = Math.max(...allDates);
  const timeRange = maxTime - minTime || 1;

  const barHeight = 24;
  const rowGap = 6;
  const labelWidth = 120;
  const chartWidth = 400;

  // Generate time axis labels
  const timeLabels: string[] = [];
  const numLabels = 5;
  for (let i = 0; i <= numLabels; i++) {
    const t = minTime + (timeRange * i) / numLabels;
    const d = new Date(t);
    timeLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Group items
  const groups = new Map<string, typeof data>();
  data.forEach(item => {
    const g = item.group || 'Tasks';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(item);
  });

  return (
    <div>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{subtitle}</p>}
        </div>
      )}

      {/* Time axis */}
      <div className="flex mb-2" style={{ paddingLeft: labelWidth + 8 }}>
        <div className="relative flex-1" style={{ height: 20 }}>
          {timeLabels.map((label, i) => (
            <span
              key={i}
              className="absolute text-[8px] -translate-x-1/2"
              style={{
                left: `${(i / numLabels) * 100}%`,
                color: 'var(--color-text-tertiary)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid lines */}
      <div className="relative" style={{ paddingLeft: labelWidth + 8 }}>
        {timeLabels.map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0"
            style={{
              left: `${(i / numLabels) * chartWidth}px`,
              width: 1,
              backgroundColor: 'var(--color-border)',
              opacity: 0.3,
              height: data.length * (barHeight + rowGap) + 16,
            }}
          />
        ))}
      </div>

      {/* Bars */}
      {Array.from(groups.entries()).map(([groupName, items]) => (
        <div key={groupName} className="mb-3">
          {groups.size > 1 && (
            <div className="text-[9px] font-semibold uppercase tracking-wider mb-1 ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {groupName}
            </div>
          )}
          {items.map((item, idx) => {
            const start = new Date(item.start).getTime();
            const end = new Date(item.end).getTime();
            const left = ((start - minTime) / timeRange) * 100;
            const width = Math.max(((end - start) / timeRange) * 100, 2);
            const color = item.color || COLORS[idx % COLORS.length];
            const isHovered = hoveredItem === item.id;

            return (
              <div
                key={item.id}
                className="flex items-center mb-1"
                style={{ height: barHeight }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Label */}
                <div
                  className="text-[10px] font-medium truncate pr-2"
                  style={{ width: labelWidth, color: 'var(--color-text-secondary)', textAlign: 'right' }}
                >
                  {item.label}
                </div>
                {/* Bar */}
                <div className="relative flex-1" style={{ height: barHeight - 4 }}>
                  <div
                    className="absolute top-0.5 h-full rounded-md transition-all"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: color,
                      opacity: isHovered ? 1 : 0.8,
                      transform: isHovered ? 'scaleY(1.15)' : 'scaleY(1)',
                      transformOrigin: 'center',
                    }}
                  >
                    {/* Progress fill */}
                    {item.progress != null && (
                      <div
                        className="absolute top-0 left-0 h-full rounded-l-md"
                        style={{
                          width: `${item.progress}%`,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                        }}
                      />
                    )}
                  </div>
                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      className="absolute -top-10 z-20 px-2 py-1 rounded-md text-[9px] font-medium whitespace-nowrap"
                      style={{
                        left: `${left}%`,
                        backgroundColor: 'var(--color-ink)',
                        color: 'var(--color-surface)',
                      }}
                    >
                      {item.label}: {new Date(item.start).toLocaleDateString()} → {new Date(item.end).toLocaleDateString()}
                      {item.progress != null ? ` (${item.progress}%)` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
