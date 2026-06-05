'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Lightbulb, CalendarRange, Trophy, Megaphone, ChevronLeft, ChevronRight, ChevronDown, X, ArrowRight, Zap, TrendingUp, MessageSquare, MessageCircle, AlertCircle } from 'lucide-react';
import CoachNote, { CoachNoteSkeleton } from '@/components/CoachNote';
import type { CoachNote as CoachNoteType, CoachNoteType as NoteType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const noteTypes: { type: NoteType; label: string; icon: React.ReactNode; description: string; color: string }[] = [
  {
    type: 'daily',
    label: 'Daily Tip',
    icon: <Lightbulb className="w-4 h-4" />,
    description: 'Get a daily career tip based on your profile',
    color: 'var(--color-bloom)'
  },
  {
    type: 'weekly',
    label: 'Weekly Insight',
    icon: <CalendarRange className="w-4 h-4" />,
    description: 'Receive a comprehensive weekly summary',
    color: 'var(--color-ember)'
  },
  {
    type: 'ad_hoc',
    label: 'Ask Coach',
    icon: <Megaphone className="w-4 h-4" />,
    description: 'Get personalized advice on any career topic',
    color: 'var(--color-pulse)'
  },
  {
    type: 'milestone',
    label: 'Milestone',
    icon: <Trophy className="w-4 h-4" />,
    description: 'Celebrate your achievements',
    color: 'var(--color-spark)'
  }
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

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const generateNote = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/coach-notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteType: selectedType,
          userQuery: selectedType === 'ad_hoc' ? userQuery : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate note');
      }

      const data = await response.json();
      if (data.note) {
        const newNote: CoachNoteType = {
          id: data.note.id,
          userId: data.note.user_id,
          content: data.note.content,
          type: data.note.type,
          actionLabel: data.note.action_label,
          actionUrl: data.note.action_url,
          priority: data.note.priority,
          expiresAt: data.note.expires_at ? new Date(data.note.expires_at) : undefined,
          createdAt: new Date(data.note.created_at),
        };
        setNotes((prev) => [newNote, ...prev]);
        setCurrentIndex(0);
      }

      if (selectedType === 'ad_hoc') {
        setUserQuery('');
      }
    } catch (err) {
      console.error('Error generating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate note');
    } finally {
      setGenerating(false);
    }
  };

  const dismissNote = async (id: string) => {
    try {
      await fetch(`/api/coach-notes/${id}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (currentIndex >= notes.length - 1) {
        setCurrentIndex(Math.max(0, notes.length - 2));
      }
    } catch (err) {
      console.error('Error dismissing note:', err);
    }
  };

  const currentNote = notes[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E]">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[var(--color-bloom)]/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[var(--color-bloom)] animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-bloom)] to-[var(--color-ember)]">
              AI Career Coach
            </h1>
          </div>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Get personalized career advice based on your proof portfolio and skills. Our AI analyzes your achievements and provides actionable guidance for your professional growth.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mb-6">
          <div className="bg-red-900/50 border border-red-500/20 rounded-xl px-6 py-4 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-white hover:underline"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid gap-8">
          {/* Left Column - Generation & Notes */}
          <div className="lg:col-span-7">
            {/* Generation Card */}
            <div className="bg-[#0F0F1A]/50 backdrop-blur-sm border border-[#1A1A2E]/30 rounded-2xl p-6 mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[var(--color-bloom)]" />
                  Generate New Note
                </h2>
                <p className="text-sm text-white/50 mt-1">
                  Select a note type and let our AI analyze your portfolio for personalized guidance.
                </p>
              </div>

              {/* Note Type Selector */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {noteTypes.map((nt) => (
                  <button
                    key={nt.type}
                    onClick={() => setSelectedType(nt.type)}
                    className={cn(
                      'group relative overflow-hidden bg-[#000000]/30 border border-[var(--color-border)]/20 rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:bg-[#000000]/40',
                      selectedType === nt.type
                        ? 'border-[var(--color-bloom)] bg-[var(--color-bloom)]/10'
                        : ''
                    )}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[${nt.color}]/20`}>
                        {nt.icon}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white">{nt.label}</p>
                      <p className="text-xs text-white/40">{nt.description}</p>
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                      {selectedType === nt.type && (
                        <div className="absolute inset-0 rounded-xl bg-[var(--color-bloom)]/20 pointer-events-none animate-pulse" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Ad-hoc Input */}
              {selectedType === 'ad_hoc' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    What would you like to ask the AI coach?
                  </label>
                  <textarea
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Ask about career advice, skill gaps, portfolio improvement, or any career-related question..."
                    className="w-full p-4 rounded-xl bg-[#000000]/30 border border-[var(--color-border)]/20 text-white placeholder-white/40 focus:outline-none focus:border-[var(--color-bloom)]/50 focus:ring-[var(--color-bloom)]/20 resize-none h-[120px]"
                    rows={4}
                  />
                  {userQuery.trim() && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => setUserQuery('')}
                        className="text-xs text-white/50 hover:text-white/70"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={generateNote}
                  disabled={generating || (selectedType === 'ad_hoc' && !userQuery.trim())}
                  className={cn(
                    'w-full bg-[var(--color-bloom)] text-white px-6 py-3 rounded-xl font-medium font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:bg-[var(--color-bloom)]/80 disabled:bg-[var(--color-bloom)]/30 disabled:cursor-not-allowed'
                  )}
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Note
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Notes Display */}
            <div className="bg-[#0F0F1A]/50 backdrop-blur-sm border border-[#1A1A2E]/30 rounded-2xl p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-[var(--color-spark)]" />
                  Your Coaching Notes
                </h2>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/50">
                    {notes.length} notes saved
                  </p>
                  {notes.length > 0 && (
                    <button
                      onClick={() => setShowTips(!showTips)}
                      className="text-sm text-white/50 hover:text-white/70 flex items-center gap-2"
                    >
                      {showTips ? 'Hide Tips' : 'Show Tips'}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notes Content */}
              {loading ? (
                <div className="space-y-4">
                  <CoachNoteSkeleton />
                  <CoachNoteSkeleton />
                  <CoachNoteSkeleton />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-[var(--color-spark)]/50" />
                  </div>
                  <p className="text-lg font-medium text-white mb-4">
                    No coach notes yet
                  </p>
                  <p className="text-sm text-white/50">
                    Generate your first note to get personalized career advice based on your portfolio.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setSelectedType('daily')}
                      className="bg-[var(--color-bloom)] text-white px-5 py-2 rounded-xl font-medium"
                    >
                      Generate First Note
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {currentNote && (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-[var(--color-bloom)]/10 pointer-events-none" />
                      <CoachNote
                        note={currentNote}
                        isLatest={currentIndex === 0}
                        showNavigation={notes.length > 1}
                        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        onNext={() => setCurrentIndex((i) => Math.min(notes.length - 1, i + 1))}
                        hasPrevious={currentIndex > 0}
                        hasNext={currentIndex < notes.length - 1}
                        onDismiss={dismissNote}
                      />
                    </div>
                  )}

                  {/* Navigation Dots */}
                  {notes.length > 1 && (
                    <div className="flex items-center justify-center mt-6">
                      {notes.slice(0, Math.min(10, notes.length)).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={cn(
                            'w-2 h-2 rounded-full transition-all duration-200',
                            idx === currentIndex
                              ? 'w-3 h-3 bg-[var(--color-bloom)]'
                              : 'w-2 h-2 bg-[#FFFFFF]/20 hover:bg-[#FFFFFF]/30'
                          )}
                          aria-label={`Go to note ${idx + 1}`}
                        />
                      ))}
                      {notes.length > 10 && (
                        <span className="mx-3 text-xs text-white/40">+{notes.length - 10} more</span>
                      )}
                    </div>
                  )}

                  {/* Page Indicator */}
                  {notes.length > 1 && (
                    <div className="text-center text-xs text-white/40 mt-4">
                      Showing {currentIndex + 1} of {notes.length} notes
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Info & Tips */}
          <div className="lg:col-span-5">
            {/* About Card */}
            <div className="bg-[#0F0F1A]/50 backdrop-blur-sm border border-[#1A1A2E]/30 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-[var(--color-bloom)]" />
                About AI Coach
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-[var(--color-bloom)]/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-2 h-2" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Personalized Analysis</p>
                    <p className="text-xs text-white/50">
                      Our AI examines your proof portfolio to identify strengths, skill gaps, and opportunities for growth.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-[var(--color-ember)]/20 rounded-full flex items-center justify-center">
                    <Zap className="w-2 h-2" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Actionable Guidance</p>
                    <p className="text-xs text-white/50">
                      Receive specific, practical advice you can apply immediately to your career development.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-[var(--color-spark)]/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-2 h-2" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Progress Tracking</p>
                    <p className="text-xs text-white/50">
                      Track your development over time with insights that evolve with your portfolio.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            {showTips && (
              <div className="bg-[#0F0F1A]/50 backdrop-blur-sm border border-[#1A1A2E]/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[var(--color-spark)]" />
                  Coaching Tips
                </h3>
                <div className="space-y-4">
                  <div className="bg-[#000000]/30 border border-[#1A1A2E]/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-2">
                      <strong>💡 Daily Tips:</strong> Perfect for quick, actionable advice you can apply today.
                    </p>
                  </div>
                  <div className="bg-[#000000]/30 border border-[#1A1A2E]/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-2">
                      <strong>📊 Weekly Insights:</strong> Comprehensive analysis of your progress and trends.
                    </p>
                  </div>
                  <div className="bg-[#000000]/30 border border-[#1A1A2E]/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-2">
                      <strong>🎯 Ask Coach:</strong> Get personalized answers to your specific career questions.
                    </p>
                  </div>
                  <div className="bg-[#000000]/30 border border-[#1A1A2E]/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-2">
                      <strong>🏆 Milestones:</strong> Celebrate your achievements and progress.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Stats Card */}
            <div className="bg-[#0F0F1A]/50 backdrop-blur-sm border border-[#1A1A2E]/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--color-ember)]" />
                Usage Limits
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-white/60">
                    <p className="font-medium text-white">Daily Tips</p>
                    <p className="text-xs">1 per day</p>
                  </div>
                  <div className="text-white/60">
                    <p className="font-medium text-white">Weekly Insights</p>
                    <p className="text-xs">1 per week</p>
                  </div>
                  <div className="text-white/60">
                    <p className="font-medium text-white">Ask Coach</p>
                    <p className="text-xs">2 per day</p>
                  </div>
                  <div className="text-white/60">
                    <p className="font-medium text-white">Milestones</p>
                    <p className="text-xs">As earned</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#1A1A2E]/20">
                  <p className="text-xs text-white/40">
                    Limits reset automatically. Check your profile for usage statistics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Quick Generate */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => {
            setSelectedType('daily');
            setUserQuery('');
            generateNote();
          }}
          className="w-14 h-14 bg-[var(--color-bloom)]/20 backdrop-blur-sm border border-[var(--color-bloom)]/30 rounded-full flex items-center justify-center hover:bg-[var(--color-bloom)]/30 transition-all duration-300 hover:scale-105"
        >
          <Sparkles className="w-6 h-6 text-[var(--color-bloom)] animate-pulse" />
        </button>
      </div>
    </div>
  );
}
