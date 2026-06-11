'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface ThinkingCardProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

/**
 * Collapsible card that shows AI reasoning/thinking during streaming.
 * Claude-style: warm cream, minimal chrome, blur reveal.
 */
export default function ThinkingCard({ content, isStreaming, className = '' }: ThinkingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (content && content.length > 0) {
      setHasContent(true);
    }
  }, [content]);

  // Auto-scroll when expanded
  useEffect(() => {
    if (expanded && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, expanded]);

  if (!hasContent && !isStreaming) return null;

  const preview = content.length > 100 ? content.slice(-100) : content;
  const lineCount = content.split('\n').length;

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        backgroundColor: '#f0ece3',
        border: '1px solid #e5e0d6',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
      >
        {isStreaming ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: '#c96442' }} />
        ) : (
          <Brain className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#c96442' }} />
        )}
        <span
          className="text-[11px] font-semibold uppercase tracking-wider flex-shrink-0"
          style={{ color: '#c96442', fontFamily: 'var(--font-mono)' }}
        >
          {isStreaming ? 'Thinking' : 'Reasoning'}
        </span>
        {isStreaming && !expanded && (
          <span className="flex items-center gap-0.5 ml-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: '#c96442', animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </span>
        )}
        {!expanded && hasContent && (
          <span
            className="text-[11px] flex-1 truncate ml-1"
            style={{ color: '#b0aaa0', fontFamily: 'var(--font-body)' }}
          >
            {preview}
          </span>
        )}
        {!expanded && !hasContent && isStreaming && (
          <span
            className="text-[11px] flex-1 ml-1"
            style={{ color: '#b0aaa0', fontFamily: 'var(--font-body)' }}
          >
            Analyzing your request...
          </span>
        )}
        {hasContent && (
          <span
            className="text-[10px] flex-shrink-0 opacity-30"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {lineCount} lines
          </span>
        )}
        {expanded
          ? <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-30" />
          : <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-30" />
        }
      </button>
      {expanded && hasContent && (
        <div
          ref={contentRef}
          className="px-3 pb-3 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto"
          style={{
            color: '#5b5950',
            fontFamily: 'var(--font-mono)',
            borderTop: '1px solid #e5e0d6',
            paddingTop: '8px',
          }}
        >
          {content}
          {isStreaming && (
            <span className="inline-block w-[6px] h-[12px] ml-0.5 align-middle animate-pulse" style={{ backgroundColor: '#c96442' }} />
          )}
        </div>
      )}
    </div>
  );
}
