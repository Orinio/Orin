/**
 * Orin Visual Response System — Spec Types & Validation
 *
 * Structured visual specifications that the backend emits and the frontend renders.
 * Never hallucinated — every visual is grounded in real data from tool calls.
 */

import { z } from 'zod';

// ============================================================
// Chart Data Points
// ============================================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  meta?: Record<string, unknown>;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

// ============================================================
// Flowchart / Process
// ============================================================

export interface FlowStep {
  id: string;
  label: string;
  description?: string;
  status: 'complete' | 'current' | 'pending' | 'error';
  icon?: string;
}

// ============================================================
// Timeline
// ============================================================

export interface TimelineEntry {
  date: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ============================================================
// Cards
// ============================================================

export interface CardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'flat' };
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardWidget {
  id: string;
  kind: 'stat' | 'bar' | 'line' | 'pie' | 'list';
  title: string;
  data: ChartDataPoint[] | TimeSeriesPoint[];
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================
// Main Visual Spec
// ============================================================

export type VisualKind =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'flowchart'
  | 'timeline'
  | 'cards'
  | 'dashboard'
  | 'explainer'
  | 'html'
  | 'mermaid'
  | 'heatmap'
  | 'radar'
  | 'gantt'
  | 'network';

export type VisualLayoutMode = 'inline' | 'panel';
export type VisualSize = 'small' | 'medium' | 'large';

export interface VisualSpec {
  id: string;
  kind: VisualKind;
  title: string;
  subtitle?: string;
  summary?: string;
  data_source?: string;

  // Chart data (bar, line, area, pie, scatter)
  series?: ChartDataPoint[];
  time_series?: TimeSeriesPoint[];

  // Diagram data
  steps?: FlowStep[];
  entries?: TimelineEntry[];

  // Card / dashboard data
  cards?: CardData[];
  widgets?: DashboardWidget[];

  // Axes for charts
  axes?: {
    x?: { label?: string; format?: string };
    y?: { label?: string; format?: string; min?: number; max?: number };
  };

  // Annotations on charts
  annotations?: Array<{
    label: string;
    value?: number;
    color?: string;
  }>;

  // Interaction capabilities
  interactions?: {
    hover?: boolean;
    click?: boolean;
    filters?: string[];
    drilldown?: boolean;
    toggle_views?: string[];
  };

  // Layout
  layout?: {
    mode?: VisualLayoutMode;
    size?: VisualSize;
  };

  // Accessibility
  accessibility?: {
    alt_text: string;
    color_contrast?: 'high' | 'normal';
    keyboard_support?: boolean;
  };

  // Text explanation accompanying the visual
  text?: {
    short_explanation?: string;
    key_takeaways?: string[];
  };

  // HTML artifact (self-contained HTML/CSS/JS)
  html?: string;

  // Mermaid diagram source code
  mermaidCode?: string;

  // Heatmap data
  heatmap?: {
    rows: string[];
    columns: string[];
    values: number[][];
    minLabel?: string;
    maxLabel?: string;
  };

  // Radar chart data
  radar?: Array<{ label: string; value: number; maxValue?: number }>;

  // Gantt chart data
  gantt?: Array<{ id: string; label: string; start: string; end: string; progress?: number; color?: string; group?: string }>;

  // Network graph data
  network?: {
    nodes: Array<{ id: string; label: string; size?: number; color?: string; group?: string }>;
    edges: Array<{ source: string; target: string; label?: string; weight?: number }>;
  };
}

// ============================================================
// Zod Schemas for Validation
// ============================================================

export const chartDataPointSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const timeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  label: z.string().optional(),
});

export const flowStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  status: z.enum(['complete', 'current', 'pending', 'error']),
  icon: z.string().optional(),
});

export const timelineEntrySchema = z.object({
  date: z.string(),
  title: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const cardDataSchema = z.object({
  title: z.string(),
  value: z.union([z.string(), z.number()]),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  trend: z.object({
    value: z.number(),
    direction: z.enum(['up', 'down', 'flat']),
  }).optional(),
});

export const dashboardWidgetSchema = z.object({
  id: z.string(),
  kind: z.enum(['stat', 'bar', 'line', 'pie', 'list']),
  title: z.string(),
  data: z.array(z.union([chartDataPointSchema, timeSeriesPointSchema])),
  size: z.enum(['sm', 'md', 'lg']).optional(),
});

export const visualSpecSchema = z.object({
  id: z.string(),
  kind: z.enum(['bar', 'line', 'area', 'pie', 'scatter', 'flowchart', 'timeline', 'cards', 'dashboard', 'explainer', 'html', 'mermaid', 'heatmap', 'radar', 'gantt', 'network']),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  summary: z.string().max(500).optional(),
  data_source: z.string().max(200).optional(),

  series: z.array(chartDataPointSchema).optional(),
  time_series: z.array(timeSeriesPointSchema).optional(),
  steps: z.array(flowStepSchema).optional(),
  entries: z.array(timelineEntrySchema).optional(),
  cards: z.array(cardDataSchema).optional(),
  widgets: z.array(dashboardWidgetSchema).optional(),

  html: z.string().optional(),
  mermaidCode: z.string().optional(),
  heatmap: z.object({
    rows: z.array(z.string()),
    columns: z.array(z.string()),
    values: z.array(z.array(z.number())),
    colorScale: z.array(z.string()).optional(),
  }).optional(),
  radar: z.array(z.object({
    axis: z.string(),
    value: z.number(),
    fullMark: z.number().optional(),
  })).optional(),
  gantt: z.array(z.object({
    id: z.string(),
    name: z.string(),
    start: z.string(),
    end: z.string(),
    progress: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
    group: z.string().optional(),
  })).optional(),
  network: z.object({
    nodes: z.array(z.object({ id: z.string(), label: z.string(), group: z.string().optional() })),
    links: z.array(z.object({ source: z.string(), target: z.string(), label: z.string().optional() })),
  }).optional(),

  axes: z.object({
    x: z.object({ label: z.string().optional(), format: z.string().optional() }).optional(),
    y: z.object({ label: z.string().optional(), format: z.string().optional(), min: z.number().optional(), max: z.number().optional() }).optional(),
  }).optional(),

  annotations: z.array(z.object({
    label: z.string(),
    value: z.number().optional(),
    color: z.string().optional(),
  })).optional(),

  interactions: z.object({
    hover: z.boolean().optional(),
    click: z.boolean().optional(),
    filters: z.array(z.string()).optional(),
    drilldown: z.boolean().optional(),
    toggle_views: z.array(z.string()).optional(),
  }).optional(),

  layout: z.object({
    mode: z.enum(['inline', 'panel']).optional(),
    size: z.enum(['small', 'medium', 'large']).optional(),
  }).optional(),

  accessibility: z.object({
    alt_text: z.string(),
    color_contrast: z.enum(['high', 'normal']).optional(),
    keyboard_support: z.boolean().optional(),
  }).optional(),

  text: z.object({
    short_explanation: z.string().optional(),
    key_takeaways: z.array(z.string()).optional(),
  }).optional(),
});

// ============================================================
// Validation Helpers
// ============================================================

export function validateVisualSpec(raw: unknown): { valid: true; spec: VisualSpec } | { valid: false; errors: string[] } {
  const result = visualSpecSchema.safeParse(raw);
  if (result.success) {
    return { valid: true, spec: result.data as VisualSpec };
  }
  return {
    valid: false,
    errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}

/**
 * Validate that a visual spec has the required data for its kind.
 */
export function validateVisualData(spec: VisualSpec): { ok: boolean; reason?: string } {
  switch (spec.kind) {
    case 'bar':
    case 'line':
    case 'area':
    case 'pie':
    case 'scatter':
      if (!spec.series || spec.series.length === 0) {
        return { ok: false, reason: `${spec.kind} chart requires at least one data point in "series"` };
      }
      if (spec.kind === 'pie' && spec.series.length > 8) {
        return { ok: false, reason: `Pie chart should have 8 or fewer segments (got ${spec.series.length})` };
      }
      break;
    case 'flowchart':
      if (!spec.steps || spec.steps.length === 0) {
        return { ok: false, reason: 'Flowchart requires at least one step' };
      }
      break;
    case 'timeline':
      if (!spec.entries || spec.entries.length === 0) {
        return { ok: false, reason: 'Timeline requires at least one entry' };
      }
      break;
    case 'cards':
      if (!spec.cards || spec.cards.length === 0) {
        return { ok: false, reason: 'Cards require at least one card' };
      }
      break;
    case 'dashboard':
      if (!spec.widgets || spec.widgets.length === 0) {
        return { ok: false, reason: 'Dashboard requires at least one widget' };
      }
      break;
    case 'explainer':
      if (!spec.cards && !spec.steps && !spec.series) {
        return { ok: false, reason: 'Explainer requires cards, steps, or series data' };
      }
      break;
  }
  return { ok: true };
}

/**
 * Parse a visual spec from an LLM response string.
 * Looks for JSON in markdown code blocks or raw JSON.
 */
export function parseVisualSpecFromText(text: string): VisualSpec | null {
  // Strategy 1: Look for visual spec in a code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && parsed.kind && parsed.id) return parsed as VisualSpec;
    } catch { /* continue */ }
  }

  // Strategy 2: Look for a visual_spec wrapper
  const specMatch = text.match(/\{[\s\S]*"kind"[\s\S]*"id"[\s\S]*\}/);
  if (specMatch) {
    try {
      const parsed = JSON.parse(specMatch[0]);
      if (parsed && parsed.kind && parsed.id) return parsed as VisualSpec;
    } catch { /* continue */ }
  }

  return null;
}
