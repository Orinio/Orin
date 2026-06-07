'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, MessageSquare } from 'lucide-react';

interface MessageRatingProps {
  messageId: string;
  onRate?: (messageId: string, rating: 'positive' | 'negative' | 'flagged') => void;
}

export function MessageRating({ messageId, onRate }: MessageRatingProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | 'flagged' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleRate = (type: 'positive' | 'negative' | 'flagged') => {
    if (rating === type) {
      setRating(null);
      return;
    }
    setRating(type);
    if (type === 'negative' || type === 'flagged') {
      setShowFeedback(true);
    } else {
      onRate?.(messageId, type);
    }
  };

  const submitFeedback = () => {
    onRate?.(messageId, rating!);
    setShowFeedback(false);
    setFeedback('');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => handleRate('positive')}
          className="p-1 rounded transition-colors"
          style={{
            color: rating === 'positive' ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
            backgroundColor: rating === 'positive' ? 'var(--color-primary-soft)' : 'transparent',
          }}
          title="Helpful"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleRate('negative')}
          className="p-1 rounded transition-colors"
          style={{
            color: rating === 'negative' ? 'var(--color-pulse)' : 'var(--color-text-tertiary)',
            backgroundColor: rating === 'negative' ? 'var(--color-pulse)10' : 'transparent',
          }}
          title="Not helpful"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleRate('flagged')}
          className="p-1 rounded transition-colors"
          style={{
            color: rating === 'flagged' ? 'var(--color-ember)' : 'var(--color-text-tertiary)',
            backgroundColor: rating === 'flagged' ? 'var(--color-ember)10' : 'transparent',
          }}
          title="Report issue"
        >
          <Flag className="w-3 h-3" />
        </button>
      </div>

      {showFeedback && (
        <div
          className="absolute top-full left-0 mt-2 w-64 p-3 rounded-xl shadow-lg z-10"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
            What went wrong?
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional feedback..."
            className="w-full text-[11px] px-2 py-1.5 rounded-lg border resize-none focus:outline-none focus:ring-1"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-ink)',
              backgroundColor: 'var(--color-surface-dim)',
            }}
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setShowFeedback(false); setFeedback(''); }}
              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={submitFeedback}
              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
