'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  CalendarRange,
  Trophy,
  Megaphone,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { CoachNote as CoachNoteType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CoachNoteProps {
  note: CoachNoteType;
  onDismiss?: (id: string) => void;
  onRefresh?: () => void;
  isLatest?: boolean;
  showNavigation?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

const typeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; accent: string }
> = {
  daily: {
    label: 'Daily Tip',
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    accent: 'var(--color-bloom)',
  },
  weekly: {
    label: 'Weekly Insight',
    icon: <CalendarRange className="w-3.5 h-3.5" />,
    accent: 'var(--color-ember)',
  },
  milestone: {
    label: 'Milestone',
    icon: <Trophy className="w-3.5 h-3.5" />,
    accent: 'var(--color-spark)',
  },
  ad_hoc: {
    label: 'Coach Note',
    icon: <Megaphone className="w-3.5 h-3.5" />,
    accent: 'var(--color-pulse)',
  },
};

export default function CoachNote({
  note,
  onDismiss,
  onRefresh,
  isLatest = false,
  showNavigation = false,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: CoachNoteProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const config = typeConfig[note.type] || typeConfig.ad_hoc;

  const handleDismiss = async () => {
    if (!onDismiss || isDismissing) return;
    setIsDismissing(true);
    try {
      await onDismiss(note.id);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div
      className={cn(
        'relative p-5 rounded-[var(--radius-xl)] overflow-hidden shadow-lg shine-wrap transition-all duration-300',
        isLatest && 'ring-2 ring-white/10'
      )}
      style={{
        background: 'linear-gradient(135deg, var(--color-ink) 0%, #1a1a2e 100%)',
      }}
    >
      <div
        className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: config.accent }}
      />
      <div
        className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full opacity-10"
        style={{ backgroundColor: config.accent }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: config.accent }}
            >
              <span className="text-white">{config.icon}</span>
            </div>
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: config.accent }}
            >
              {config.label}
            </p>
            {isLatest && (
              <span className="flex items-center gap-1 text-[10px] text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Latest
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showNavigation && (
              <>
                <button
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  className="flex items-center justify-center w-6 h-6 rounded-full transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous note"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-white/50" />
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="flex items-center justify-center w-6 h-6 rounded-full transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next note"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                </button>
              </>
            )}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                disabled={isDismissing}
                className="flex items-center justify-center w-6 h-6 rounded-full transition-colors hover:bg-white/10 disabled:opacity-50"
                aria-label="Dismiss note"
              >
                <X className="w-3.5 h-3.5 text-white/50 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-white/90">{note.content}</p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-[10px] text-white/30">
            {note.createdAt.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-[10px] text-white/50 hover:text-white/70 transition-colors"
              >
                Refresh
              </button>
            )}
            {note.actionLabel && note.actionUrl && (
              <Link
                href={note.actionUrl}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-md)] transition-colors bg-white/10 hover:bg-white/20 text-white"
              >
                {note.actionLabel}
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoachNoteSkeleton() {
  return (
    <div
      className="relative p-5 rounded-[var(--radius-xl)] overflow-hidden shadow-lg animate-pulse"
      style={{
        background: 'linear-gradient(135deg, var(--color-ink) 0%, #1a1a2e 100%)',
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-white/10" />
          <div className="w-20 h-3 rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="w-full h-3 rounded bg-white/10" />
          <div className="w-3/4 h-3 rounded bg-white/10" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="w-12 h-2 rounded bg-white/10" />
          <div className="w-16 h-6 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}
