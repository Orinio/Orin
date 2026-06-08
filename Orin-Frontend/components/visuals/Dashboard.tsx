'use client';

import type { DashboardWidget, ChartDataPoint, TimeSeriesPoint } from '@/lib/visual-spec';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';

interface DashboardProps {
  widgets: DashboardWidget[];
  title?: string;
  subtitle?: string;
}

function isTimeSeries(d: ChartDataPoint[] | TimeSeriesPoint[]): d is TimeSeriesPoint[] {
  return d.length > 0 && 'date' in d[0];
}

function toChartData(data: ChartDataPoint[] | TimeSeriesPoint[]): ChartDataPoint[] {
  if (isTimeSeries(data)) {
    return data.map(d => ({ label: d.date, value: d.value }));
  }
  return data;
}

export function Dashboard({ widgets, title, subtitle }: DashboardProps) {
  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.kind) {
      case 'bar':
        return (
          <BarChart
            data={toChartData(widget.data)}
            title={widget.title}
            size="small"
          />
        );
      case 'line':
        return (
          <LineChart
            data={toChartData(widget.data)}
            title={widget.title}
            size="small"
          />
        );
      case 'pie':
        return (
          <PieChart
            data={toChartData(widget.data)}
            title={widget.title}
            size="small"
          />
        );
      case 'stat': {
        const first = widget.data[0];
        return (
          <div className="p-3">
            <p className="text-[10px] mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {widget.title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono" style={{ color: 'var(--color-bloom)' }}>
                {first?.value ?? 0}
              </span>
            </div>
          </div>
        );
      }
      case 'list': {
        const chartData = toChartData(widget.data);
        return (
          <div className="p-3">
            <p className="text-[10px] mb-2 font-bold" style={{ color: 'var(--color-ink)' }}>
              {widget.title}
            </p>
            {chartData.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.label}
                </span>
                <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--color-ink)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

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
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-paper)',
              border: '1px solid var(--color-border)',
            }}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
}
