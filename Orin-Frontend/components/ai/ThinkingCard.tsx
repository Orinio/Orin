'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThinkingCardProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

/**
 * Thinking indicator card — Claude-style.
 * Shows "Thinking..." during streaming, "Thought for Xs" when done.
 * Does NOT expose raw chain-of-thought (modern AI UX best practice).
 */
export default function ThinkingCard({ content, isStreaming, className = '' }: ThinkingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const wasStreamingRef = useRef<boolean>(false);

  // Track when streaming starts
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      startTimeRef.current = Date.now();
      wasStreamingRef.current = true;
    }
    if (!isStreaming) {
      wasStreamingRef.current = false;
    }
  }, [isStreaming]);

  // Elapsed timer
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => {
    if (content && content.length > 0) {
      setHasContent(true);
    }
  }, [content]);

  if (!hasContent && !isStreaming) return null;

  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        backgroundColor: '#f0ece3',
        border: '1px solid #e5e0d6',
      }}
    >
      {/* Main indicator — simple, clean, no raw content */}
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
          {isStreaming ? 'Thinking' : 'Thought'}
        </span>

        {/* Elapsed timer */}
        {(isStreaming || elapsed > 0) && (
          <span
            className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: 'rgba(201,100,66,0.1)',
              color: '#c96442',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {isStreaming ? `for ${formatElapsed(elapsed)}` : `for ${formatElapsed(elapsed)}`}
          </span>
        )}

        {/* Animated dots when streaming and no content yet */}
        {isStreaming && !hasContent && (
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

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="flex-shrink-0 ml-auto"
        >
          <ChevronDown className="w-3 h-3 opacity-30" />
        </motion.div>
      </button>

      {/* Expandable raw content (power users only, hidden by default) */}
      <AnimatePresence initial={false}>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: 'spring', stiffness: 500, damping: 35, mass: 0.8 },
              opacity: { duration: 0.2, ease: 'easeInOut' },
            }}
            className="overflow-hidden"
          >
            <div
              className="px-3 pb-3 text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto"
              style={{
                color: '#5b5950',
                fontFamily: 'var(--font-mono)',
                borderTop: '1px solid #e5e0d6',
                paddingTop: '8px',
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
