'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Lightbulb, CalendarRange, Trophy, Megaphone, ChevronDown, ArrowRight, Zap, TrendingUp, MessageSquare, MessageCircle, AlertCircle } from 'lucide-react';
import CoachNote, { CoachNoteSkeleton } from '@/components/CoachNote';
import type { CoachNote as CoachNoteType, CoachNoteType as NoteType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const noteTypes: { type: NoteType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  { type: 'daily', label: 'Daily Tip', icon: <Lightbulb className="w-4 h-4" />, description: 'Get a daily career tip based on your profile', color: 'var(--color-bloom)' },
  { type: 'weekly', label: 'Weekly Insight', icon: <CalendarRange className="w-4 h-4" />, description: 'Receive a comprehensive weekly summary', color: 'var(--color-ember)' },
  { type: 'ad_hoc', label: 'Ask Coach', icon: <Megaphone className="w-4 h-4" />, description: 'Get personalized advice on any career topic', color: 'var(--color-pulse)' },
  { type: 'milestone', label: 'Milestone', icon: <Trophy className="w-4 h-4" />, description: 'Celebrate your achievements', color: 'var(--color-spark)' },
];

export default function CoachPage() {
  return (
    <ErrorBoundary>
      <CoachContent />
    </ErrorBoundary>
  );
}

function CoachContent() {
  const [notes, setNotes] = useState<CoachNoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<NoteType>('daily');
  const [userQuery, setUserQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coach-notes');
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data.coachNotes || data.notes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load coach notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const generateNote = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/coach-notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteType: selectedType, userQuery: selectedType === 'ad_hoc' ? userQuery : undefined }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to generate note'); }
      const data = await response.json();
      if (data.note) {
        const newNote: CoachNoteType = { id: data.note.id, userId: data.note.user_id, content: data.note.content, type: data.note.type, actionLabel: data.note.action_label, actionUrl: data.note.action_url, priority: data.note.priority, expiresAt: data.note.expires_at ? new Date(data.note.expires_at) : undefined, createdAt: new Date(data.note.created_at) };
        setNotes((prev) => [newNote, ...prev]);
        setCurrentIndex(0);
      }
      if (selectedType === 'ad_hoc') setUserQuery('');
    } catch (err) {
      console.error('Error generating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate note');
    } finally { setGenerating(false); }
  };

  const dismissNote = async (id: string) => {
    try {
      await fetch(`/api/coach-notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (currentIndex >= notes.length - 1) setCurrentIndex(Math.max(0, notes.length - 2));
    } catch (err) { console.error('Error dismissing note:', err); }
  };

  const currentNote = notes[currentIndex];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center animate-fadeInUp">
        <div className="mb-6 inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
            <Sparkles className="h-6 w-6 animate-pulse" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="gradient-text-bloom">AI Career Coach</span>
          </h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg" style={{ color: 'var(--color-text-tertiary)' }}>
          Get personalized career advice based on your proof portfolio and skills.
        </p>
      </header>

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-4xl flex items-start gap-4 rounded-xl px-6 py-4" style={{ border: '1px solid var(--color-pulse)40', backgroundColor: 'var(--color-pulse)08' }}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pulse)' }} />
          <div className="flex-1">
            <p className="font-medium" style={{ color: 'var(--color-pulse)' }}>{error}</p>
            <button onClick={() => setError(null)} className="ml-2 text-sm hover:underline" style={{ color: 'var(--color-pulse)' }}>dismiss</button>
          </div>
        </div>
      )}

      {/* Generation Card */}
      <div className="card-premium mx-auto max-w-4xl p-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className="mb-6">
          <h2 className="flex items-center gap-3 text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            <Zap className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
            Generate New Note
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Select a note type and let our AI analyze your portfolio for personalized guidance.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {noteTypes.map((nt) => (
            <button key={nt.type} onClick={() => setSelectedType(nt.type)}
              className="group relative overflow-hidden rounded-xl border p-5 flex flex-col items-center gap-3 transition-all duration-300"
              style={{
                borderColor: selectedType === nt.type ? 'var(--color-bloom)' : 'var(--color-border)',
                backgroundColor: selectedType === nt.type ? 'var(--color-bloom)08' : 'transparent',
              }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${nt.color}20` }}>
                {nt.icon}
              </div>
              <div className="text-center">
                <p className="font-semibold" style={{ color: 'var(--color-ink)' }}>{nt.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{nt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {selectedType === 'ad_hoc' && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>What would you like to ask the AI coach?</label>
            <textarea value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Ask about career advice, skill gaps, portfolio improvement..."
              className="w-full resize-none rounded-xl border p-4 text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }} rows={4} />
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={generateNote} disabled={generating || (selectedType === 'ad_hoc' && !userQuery.trim())}
            className="btn-success w-full px-6 py-3 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed">
            {generating ? (<><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</>) : (<><Sparkles className="h-4 w-4" /> Generate Note</>)}
          </button>
        </div>
      </div>

      {/* Notes Display */}
      <div className="card-premium mx-auto max-w-4xl p-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="mb-6">
          <h2 className="flex items-center gap-3 text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            <MessageSquare className="h-5 w-5" style={{ color: 'var(--color-spark)' }} />
            Your Coaching Notes
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{notes.length} notes saved</p>
            {notes.length > 0 && (
              <button onClick={() => setShowTips(!showTips)} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {showTips ? 'Hide Tips' : 'Show Tips'}
                <ChevronDown className={`h-3 w-3 transition-transform ${showTips ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4"><CoachNoteSkeleton /><CoachNoteSkeleton /><CoachNoteSkeleton /></div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-spark)12' }}>
              <Sparkles className="h-8 w-8" style={{ color: 'var(--color-spark)' }} />
            </div>
            <p className="mb-2 text-lg font-medium" style={{ color: 'var(--color-ink)' }}>No coach notes yet</p>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Generate your first note to get personalized career advice based on your portfolio.</p>
            <button onClick={() => setSelectedType('daily')} className="btn-success mt-6 px-5 py-2 text-sm font-medium">Generate First Note</button>
          </div>
        ) : (
          <>
            {currentNote && (
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ backgroundColor: 'var(--color-bloom)06' }} />
                <CoachNote note={currentNote} isLatest={currentIndex === 0} showNavigation={notes.length > 1}
                  onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  onNext={() => setCurrentIndex((i) => Math.min(notes.length - 1, i + 1))}
                  hasPrevious={currentIndex > 0} hasNext={currentIndex < notes.length - 1} onDismiss={dismissNote} />
              </div>
            )}
            {notes.length > 1 && (
              <div className="mt-6 flex items-center justify-center">
                {notes.slice(0, Math.min(10, notes.length)).map((_, idx) => (
                  <button key={idx} onClick={() => setCurrentIndex(idx)} className="mx-0.5 rounded-full transition-all duration-200"
                    style={{
                      width: idx === currentIndex ? '12px' : '8px',
                      height: idx === currentIndex ? '12px' : '8px',
                      backgroundColor: idx === currentIndex ? 'var(--color-bloom)' : 'var(--color-border)',
                    }} aria-label={`Go to note ${idx + 1}`} />
                ))}
                {notes.length > 10 && <span className="ml-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>+{notes.length - 10} more</span>}
              </div>
            )}
            {notes.length > 1 && <p className="mt-4 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Showing {currentIndex + 1} of {notes.length} notes</p>}
          </>
        )}
      </div>

      {/* About & Tips */}
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
        <div className="card-premium p-6">
          <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            <MessageCircle className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
            About AI Coach
          </h3>
          <div className="space-y-4">
            {[
              { icon: <Sparkles className="w-3 h-3" />, color: 'var(--color-bloom)', title: 'Personalized Analysis', desc: 'Our AI examines your proof portfolio to identify strengths, skill gaps, and opportunities for growth.' },
              { icon: <Zap className="w-3 h-3" />, color: 'var(--color-ember)', title: 'Actionable Guidance', desc: 'Receive specific, practical advice you can apply immediately to your career development.' },
              { icon: <TrendingUp className="w-3 h-3" />, color: 'var(--color-spark)', title: 'Progress Tracking', desc: 'Track your development over time with insights that evolve with your portfolio.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${item.color}20` }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{item.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium p-6">
          <h3 className="mb-4 flex items-center gap-3 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            <AlertCircle className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
            Usage Limits
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Daily Tips', limit: '1 per day' },
              { label: 'Weekly Insights', limit: '1 per week' },
              { label: 'Ask Coach', limit: '2 per day' },
              { label: 'Milestones', limit: 'As earned' },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-medium" style={{ color: 'var(--color-ink)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{item.limit}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Limits reset automatically. Check your profile for usage statistics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
