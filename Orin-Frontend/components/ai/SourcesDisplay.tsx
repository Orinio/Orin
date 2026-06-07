'use client';

import { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react';

export interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface SourcesDisplayProps {
  sources: Source[];
  className?: string;
}

export function SourcesDisplay({ sources, className = '' }: SourcesDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const visibleSources = expanded ? sources : sources.slice(0, 3);

  return (
    <div
      className={`rounded-xl overflow-hidden my-3 ${className}`}
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-dim)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: expanded ? '1px solid var(--color-border)' : 'none' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <Search className="w-3 h-3" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
            {sources.length} source{sources.length > 1 ? 's' : ''}
          </span>
        </div>
        {sources.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {expanded ? 'Show less' : `+${sources.length - 3} more`}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Source list */}
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {visibleSources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 px-3 py-2.5 transition-colors group"
            style={{ textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
              style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-bloom)' }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                <span className="text-xs font-medium truncate group-hover:underline" style={{ color: 'var(--color-ink)' }}>
                  {source.title}
                </span>
              </div>
              <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                {new URL(source.url).hostname}
              </p>
              {source.snippet && (
                <p className="text-[11px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {source.snippet}
                </p>
              )}
            </div>
            <ExternalLink className="w-3 h-3 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-tertiary)' }} />
          </a>
        ))}
      </div>
    </div>
  );
}
