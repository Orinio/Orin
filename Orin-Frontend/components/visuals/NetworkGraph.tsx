'use client';

import { useState, useMemo } from 'react';

interface NetworkGraphProps {
  data: {
    nodes: Array<{ id: string; label: string; size?: number; color?: string; group?: string }>;
    edges: Array<{ source: string; target: string; label?: string; weight?: number }>;
  };
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
}

const GROUP_COLORS: Record<string, string> = {
  default: 'rgba(59, 130, 246, 0.8)',
  skill: 'rgba(16, 185, 129, 0.8)',
  project: 'rgba(245, 158, 11, 0.8)',
  goal: 'rgba(139, 92, 246, 0.8)',
};

export function NetworkGraph({ data, title, subtitle, size = 'medium' }: NetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const dimension = size === 'small' ? 200 : size === 'large' ? 400 : 300;
  const center = dimension / 2;

  // Simple force-directed layout simulation
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const n = data.nodes.length;
    data.nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const radius = n <= 4 ? dimension * 0.2 : dimension * 0.32;
      pos[node.id] = {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });

    // Simple overlap resolution
    for (let iter = 0; iter < 20; iter++) {
      for (const a of data.nodes) {
        for (const b of data.nodes) {
          if (a.id === b.id) continue;
          const dx = pos[b.id].x - pos[a.id].x;
          const dy = pos[b.id].y - pos[a.id].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 50) {
            const push = (50 - dist) * 0.1;
            const angle = Math.atan2(dy, dx);
            pos[b.id].x += push * Math.cos(angle);
            pos[b.id].y += push * Math.sin(angle);
            pos[a.id].x -= push * Math.cos(angle);
            pos[a.id].y -= push * Math.sin(angle);
          }
        }
      }
    }

    return pos;
  }, [data.nodes, dimension, center]);

  const getNodeColor = (node: typeof data.nodes[0]) => {
    return node.color || GROUP_COLORS[node.group || ''] || GROUP_COLORS.default;
  };

  const connectedNodes = useMemo(() => {
    const connected = new Set<string>();
    if (hoveredNode) {
      data.edges.forEach(e => {
        if (e.source === hoveredNode) connected.add(e.target);
        if (e.target === hoveredNode) connected.add(e.source);
      });
    }
    return connected;
  }, [hoveredNode, data.edges]);

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
          {/* Edges */}
          {data.edges.map((edge, i) => {
            const s = positions[edge.source];
            const t = positions[edge.target];
            if (!s || !t) return null;
            const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
            return (
              <g key={i}>
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isHighlighted ? 'rgba(59, 130, 246, 0.6)' : 'var(--color-border)'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={hoveredNode ? (isHighlighted ? 1 : 0.2) : 0.4}
                />
                {edge.label && isHighlighted && (
                  <text
                    x={(s.x + t.x) / 2}
                    y={(s.y + t.y) / 2 - 4}
                    textAnchor="middle"
                    fontSize="8"
                    fill="var(--color-text-tertiary)"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {data.nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            const r = node.size || 16;
            const isHovered = hoveredNode === node.id;
            const isConnected = connectedNodes.has(node.id);
            const dimmed = hoveredNode && !isHovered && !isConnected;

            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? r + 3 : r}
                  fill={getNodeColor(node)}
                  opacity={dimmed ? 0.2 : 1}
                  stroke={isHovered ? 'var(--color-ink)' : 'white'}
                  strokeWidth={isHovered ? 2 : 1.5}
                  style={{ transition: 'all 0.15s', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                <text
                  x={pos.x}
                  y={pos.y + r + 10}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight={isHovered ? '600' : '400'}
                  fill={dimmed ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)'}
                  opacity={dimmed ? 0.3 : 1}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
