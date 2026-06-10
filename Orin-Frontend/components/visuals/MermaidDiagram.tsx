'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
  title?: string;
  className?: string;
}

export function MermaidDiagram({ code, title, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: 'rgba(59, 130, 246, 0.15)',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: 'rgba(59, 130, 246, 0.5)',
            lineColor: 'rgba(59, 130, 246, 0.4)',
            secondaryColor: 'rgba(16, 185, 129, 0.15)',
            tertiaryColor: 'rgba(139, 92, 246, 0.15)',
            background: '#0f172a',
            mainBkg: '#1e293b',
            nodeBorder: 'rgba(59, 130, 246, 0.5)',
            clusterBkg: 'rgba(30, 41, 59, 0.8)',
            titleColor: '#e2e8f0',
            edgeLabelBackground: '#1e293b',
          },
          fontFamily: 'inherit',
          flowchart: { curve: 'basis', padding: 15 },
        });

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    }

    renderMermaid();
    return () => { cancelled = true; };
  }, [code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className={`rounded-xl overflow-hidden ${className || ''}`} style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--color-ink)' }}>
          {title || 'Diagram'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Copy Mermaid source"
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 flex justify-center overflow-auto ${expanded ? 'max-h-none' : 'max-h-[500px]'}`}>
        {error ? (
          <div className="text-center">
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Failed to render diagram</p>
            <pre className="text-[10px] p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </pre>
            <pre className="text-[10px] mt-2 p-2 rounded-lg text-left" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {code}
            </pre>
          </div>
        ) : svg ? (
          <div
            ref={containerRef}
            className="mermaid-content"
            dangerouslySetInnerHTML={{ __html: svg }}
            style={{ maxWidth: '100%' }}
          />
        ) : (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-bloom)' }} />
            Rendering diagram...
          </div>
        )}
      </div>
    </div>
  );
}
