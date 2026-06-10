'use client';

import type { VisualSpec } from '@/lib/visual-spec';
import { BarChart, LineChart, PieChart, ScatterPlot } from './charts';
import { Flowchart, Timeline, Cards, Dashboard } from './diagrams';
import { HtmlArtifact } from './HtmlArtifact';
import { MermaidDiagram } from './MermaidDiagram';
import { HeatMap } from './HeatMap';
import { RadarChart } from './RadarChart';
import { GanttChart } from './GanttChart';
import { NetworkGraph } from './NetworkGraph';

interface VisualRendererProps {
  spec: VisualSpec;
  className?: string;
  compact?: boolean;
}

export function VisualRenderer({ spec, className, compact = false }: VisualRendererProps) {
  const size = compact ? 'small' : (spec.layout?.size || 'medium');

  const renderContent = () => {
    switch (spec.kind) {
      case 'bar':
        return (
          <BarChart
            data={spec.series || []}
            title={spec.title}
            subtitle={spec.subtitle}
            yAxisLabel={spec.axes?.y?.label}
            annotations={spec.annotations}
            size={size}
          />
        );

      case 'line':
      case 'area':
        return (
          <LineChart
            data={spec.series || []}
            title={spec.title}
            subtitle={spec.subtitle}
            yAxisLabel={spec.axes?.y?.label}
            annotations={spec.annotations}
            size={size}
          />
        );

      case 'pie':
        return (
          <PieChart
            data={spec.series || []}
            title={spec.title}
            subtitle={spec.subtitle}
            annotations={spec.annotations}
            size={size}
          />
        );

      case 'scatter':
        return (
          <ScatterPlot
            data={spec.series || []}
            title={spec.title}
            subtitle={spec.subtitle}
            xAxisLabel={spec.axes?.x?.label}
            yAxisLabel={spec.axes?.y?.label}
            size={size}
          />
        );

      case 'flowchart':
        return (
          <Flowchart
            steps={spec.steps || []}
            title={spec.title}
            subtitle={spec.subtitle}
          />
        );

      case 'timeline':
        return (
          <Timeline
            entries={spec.entries || []}
            title={spec.title}
            subtitle={spec.subtitle}
          />
        );

      case 'cards':
        return (
          <Cards
            cards={spec.cards || []}
            title={spec.title}
            subtitle={spec.subtitle}
          />
        );

      case 'dashboard':
        return (
          <Dashboard
            widgets={spec.widgets || []}
            title={spec.title}
            subtitle={spec.subtitle}
          />
        );

      case 'explainer':
        return (
          <div className="space-y-4">
            {spec.text?.short_explanation && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
                {spec.text.short_explanation}
              </p>
            )}
            {spec.text?.key_takeaways && spec.text.key_takeaways.length > 0 && (
              <div className="space-y-1">
                {spec.text.key_takeaways.map((takeaway, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] mt-0.5" style={{ color: 'var(--color-bloom)' }}>{'\u2022'}</span>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>{takeaway}</span>
                  </div>
                ))}
              </div>
            )}
            {spec.series && spec.series.length > 0 && (
              <BarChart data={spec.series} size={size} annotations={spec.annotations} />
            )}
          </div>
        );

      case 'html':
        return <HtmlArtifact html={spec.html || ''} title={spec.title} />;

      case 'mermaid':
        return <MermaidDiagram code={spec.mermaidCode || ''} title={spec.title} />;

      case 'heatmap':
        return spec.heatmap ? (
          <HeatMap data={spec.heatmap} title={spec.title} subtitle={spec.subtitle} size={size} />
        ) : null;

      case 'radar':
        return spec.radar ? (
          <RadarChart data={spec.radar} title={spec.title} subtitle={spec.subtitle} size={size} />
        ) : null;

      case 'gantt':
        return spec.gantt ? (
          <GanttChart data={spec.gantt} title={spec.title} subtitle={spec.subtitle} size={size} />
        ) : null;

      case 'network':
        return spec.network ? (
          <NetworkGraph data={spec.network} title={spec.title} subtitle={spec.subtitle} size={size} />
        ) : null;

      default:
        return (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Unknown visual type
          </div>
        );
    }
  };

  return (
    <div
      className={`rounded-xl overflow-hidden ${className || ''}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        maxWidth: size === 'small' ? '400px' : size === 'large' ? '800px' : '600px',
      }}
    >
      <div className="p-4">
        {renderContent()}
      </div>

      {spec.data_source && (
        <div
          className="px-4 py-2 text-[9px] flex items-center gap-1"
          style={{
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Source: {spec.data_source}
        </div>
      )}
    </div>
  );
}
