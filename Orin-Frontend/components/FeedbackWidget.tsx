'use client';

import { useState, useCallback } from 'react';
import { MessageSquare, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();

  const handleSubmit = useCallback(async () => {
    if (!feedback.trim()) return;

    setSubmitting(true);
    trackEvent('feedback_submitted', { type, messageLength: feedback.length });

    try {
      if (supabase) {
        await supabase.from('contact_messages').insert({
          name: user?.email || 'Anonymous',
          email: user?.email || '',
          subject: `[Feedback] ${type}`,
          message: feedback.trim(),
        });
      }
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedback('');
        setType('general');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  }, [feedback, type, user]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
        aria-label="Send feedback"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* Feedback panel */}
      {isOpen && (
        <div className="fixed bottom-34 right-4 z-50 w-[340px] rounded-2xl shadow-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {submitted ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--color-bloom)' }} />
              <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>Thank you!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your feedback helps us improve.</p>
            </div>
          ) : (
            <div className="p-4">
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--color-ink)' }}>
                Send Feedback
              </h3>

              {/* Type selector */}
              <div className="flex gap-2 mb-3">
                {(['general', 'bug', 'feature'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: type === t ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                      color: type === t ? 'white' : 'var(--color-text-secondary)',
                    }}
                  >
                    {t === 'bug' ? 'Bug' : t === 'feature' ? 'Feature' : 'General'}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                className="w-full rounded-xl border bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
                style={{ borderColor: 'var(--color-border)' }}
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!feedback.trim() || submitting}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-bloom)' }}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
