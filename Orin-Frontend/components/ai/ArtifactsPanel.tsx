'use client';

import { useState, useCallback } from 'react';
import { Code2, Eye, Copy, Check, X, Maximize2, Minimize2, FileCode, FileText, Image, BarChart3 } from 'lucide-react';
import { VisualRenderer } from '@/components/visuals/VisualRenderer';

export interface Artifact {
  id: string;
  type: 'code' | 'html' | 'markdown' | 'mermaid' | 'visual';
  title: string;
  content: string;
  language?: string;
  visualSpec?: Record<string, any>;
}

interface ArtifactsPanelProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
  onClose: () => void;
  className?: string;
}

export function ArtifactsPanel({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onClose,
  className = '',
}: ArtifactsPanelProps) {
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [copied, setCopied] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const activeArtifact = artifacts.find(a => a.id === activeArtifactId);

  const handleCopy = useCallback(() => {
    if (!activeArtifact) return;
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeArtifact]);

  if (!activeArtifact) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'code': return Code2;
      case 'html': return FileCode;
      case 'markdown': return FileText;
      case 'mermaid': return Image;
      case 'visual': return BarChart3;
      default: return Code2;
    }
  };

  const ArtifactIcon = getIcon(activeArtifact.type);

  return (
    <div
      className={`flex flex-col h-full ${maximized ? 'fixed inset-0 z-50' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ArtifactIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
          <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
            {activeArtifact.title}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* View mode toggle (only for code/html) */}
          {(activeArtifact.type === 'code' || activeArtifact.type === 'html') && (
            <div className="flex rounded-lg overflow-hidden mr-1" style={{ border: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setViewMode('code')}
                className="px-2 py-1 text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: viewMode === 'code' ? 'var(--color-bloom)' : 'transparent',
                  color: viewMode === 'code' ? 'white' : 'var(--color-text-tertiary)',
                }}
              >
                <Code2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className="px-2 py-1 text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: viewMode === 'preview' ? 'var(--color-bloom)' : 'transparent',
                  color: viewMode === 'preview' ? 'white' : 'var(--color-text-tertiary)',
                }}
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setMaximized(!maximized)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'code' ? (
          <pre
            className="p-4 text-[13px] leading-relaxed font-mono overflow-x-auto"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)', margin: 0 }}
          >
            {activeArtifact.content}
          </pre>
        ) : activeArtifact.type === 'html' ? (
          <iframe
            srcDoc={activeArtifact.content}
            className="w-full h-full border-0"
            title={activeArtifact.title}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : activeArtifact.type === 'visual' && activeArtifact.visualSpec ? (
          <div className="p-4">
            <VisualRenderer spec={activeArtifact.visualSpec as any} />
          </div>
        ) : activeArtifact.type === 'markdown' ? (
          <div className="p-4 text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
            <pre className="whitespace-pre-wrap font-sans">{activeArtifact.content}</pre>
          </div>
        ) : (
          <div className="p-4 text-sm" style={{ color: 'var(--color-ink)' }}>
            <pre className="whitespace-pre-wrap font-mono text-xs">{activeArtifact.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
