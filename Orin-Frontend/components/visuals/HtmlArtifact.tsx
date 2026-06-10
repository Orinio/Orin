'use client';

import { useState, useCallback } from 'react';
import { Code2, Eye, Copy, Check, ExternalLink } from 'lucide-react';

interface HtmlArtifactProps {
  html: string;
  title?: string;
  className?: string;
}

export function HtmlArtifact({ html, title, className }: HtmlArtifactProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const handleOpenNewTab = useCallback(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [html]);

  return (
    <div className={`rounded-xl overflow-hidden ${className || ''}`} style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold" style={{ color: 'var(--color-ink)' }}>
            {title || 'Interactive Preview'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden mr-1" style={{ border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setViewMode('preview')}
              className="px-2 py-1 text-[10px] font-medium transition-colors flex items-center gap-1"
              style={{
                backgroundColor: viewMode === 'preview' ? 'var(--color-bloom)' : 'transparent',
                color: viewMode === 'preview' ? 'white' : 'var(--color-text-tertiary)',
              }}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className="px-2 py-1 text-[10px] font-medium transition-colors flex items-center gap-1"
              style={{
                backgroundColor: viewMode === 'code' ? 'var(--color-bloom)' : 'transparent',
                color: viewMode === 'code' ? 'white' : 'var(--color-text-tertiary)',
              }}
            >
              <Code2 className="w-3 h-3" /> Code
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleOpenNewTab}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {viewMode === 'preview' ? (
          <div className="w-full" style={{ minHeight: '300px', maxHeight: '600px' }}>
            <iframe
              srcDoc={html}
              className="w-full border-0"
              style={{ height: '500px' }}
              title={title || 'Interactive Preview'}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <pre
            className="p-4 text-[12px] leading-relaxed font-mono overflow-x-auto max-h-[500px] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)', margin: 0 }}
          >
            {html}
          </pre>
        )}
      </div>
    </div>
  );
}
