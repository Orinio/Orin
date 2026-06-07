'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Check,
  Cloud,
  MessageSquare,
  Trophy,
  Zap,
  HardDrive,
  Github,
  ArrowRight,
  Crown,
  Shield,
  Infinity as InfinityIcon,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { usePlan } from '@/lib/plan-context';
import { PLANS, type UsageMetric } from '@/lib/chat-types';
import { formatTimeUntilReset, type LimitInfo } from '@/lib/use-usage';

interface UpgradePromptProps {
  variant?: 'banner' | 'inline' | 'modal';
  metric?: UsageMetric;
  limitInfo?: LimitInfo;
  feature?: string;
  reason?: 'limit' | 'feature' | 'general';
  dismissible?: boolean;
  showCloseOn?: 'banner' | 'modal';
  compact?: boolean;
}

const FEATURE_COPY: Record<string, { headline: string; sub: string; bullets: { icon: any; text: string }[] }> = {
  ai_messages: {
    headline: 'You hit the 50-message limit',
    sub: 'Free plan resets monthly. Pro gives you unlimited AI coach messages so you can keep going whenever inspiration strikes.',
    bullets: [
      { icon: InfinityIcon, text: 'Unlimited AI coach conversations' },
      { icon: Cloud, text: 'Chats sync across phone, tablet, and laptop' },
      { icon: Trophy, text: 'Portfolio scoring & skill gap reports' },
    ],
  },
  proof_cards: {
    headline: "You're at 5 of 5 proof cards",
    sub: 'Free plan tops out at 5 proof cards. Pro unlocks unlimited verified proof so you can show your full story.',
    bullets: [
      { icon: InfinityIcon, text: 'Unlimited proof cards' },
      { icon: Cloud, text: 'Import from Drive, Dropbox, GitHub, Notion' },
      { icon: Trophy, text: 'Highlight what makes you stand out' },
    ],
  },
  integrations: {
    headline: 'Cloud connectors are a Pro feature',
    sub: 'Connect Drive, Dropbox, OneDrive, Notion, and GitHub to import work and turn it into proof automatically.',
    bullets: [
      { icon: HardDrive, text: '5 cloud connectors, OAuth read-only' },
      { icon: Github, text: 'Import repos, READMEs, and contributions' },
      { icon: Sparkles, text: 'Auto-extract skills and what-it-proves' },
    ],
  },
  portfolio_scores: {
    headline: 'Portfolio scoring is Pro',
    sub: 'Get an AI-graded portfolio with concrete suggestions to improve recruiter conversion.',
    bullets: [
      { icon: Trophy, text: 'AI-graded portfolio score' },
      { icon: Zap, text: 'Concrete improvements, not just grades' },
      { icon: MessageSquare, text: 'Skill gap reports per target role' },
    ],
  },
  opportunity_matches: {
    headline: 'Only 3 free matches per month',
    sub: 'Pro unlocks unlimited AI-matched opportunities with reasoning for every match.',
    bullets: [
      { icon: Zap, text: 'Unlimited AI-matched opportunities' },
      { icon: MessageSquare, text: 'See why you match (and what you lack)' },
      { icon: Cloud, text: 'Save opportunities to your cloud-synced board' },
    ],
  },
  cover_letters: {
    headline: 'Cover letters are limited on Free',
    sub: 'Generate personalized cover letters for every application. Pro removes the cap.',
    bullets: [
      { icon: Sparkles, text: 'Unlimited AI cover letters' },
      { icon: Trophy, text: 'Tailored to the role and your proof' },
      { icon: Cloud, text: 'Synced to your account' },
    ],
  },
  general: {
    headline: 'Unlock everything with Pro',
    sub: 'Get unlimited AI, cloud storage, connectors, and portfolio scoring — for less than a coffee a month.',
    bullets: [
      { icon: InfinityIcon, text: 'Unlimited AI coach messages' },
      { icon: Cloud, text: 'Cloud-synced chats across all devices' },
      { icon: HardDrive, text: 'Drive, Dropbox, OneDrive, Notion, GitHub' },
    ],
  },
};

export function UpgradePrompt({
  variant = 'inline',
  metric,
  limitInfo,
  feature,
  reason = 'feature',
  dismissible = true,
  compact = false,
}: UpgradePromptProps) {
  const { plan, planDef, isFree } = usePlan();
  const [dismissed, setDismissed] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!limitInfo?.resetsAt || limitInfo.isUnlimited) return;
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [limitInfo?.resetsAt, limitInfo?.isUnlimited]);

  if (dismissed) return null;
  if (!isFree && reason === 'feature') return null;
  if (plan === 'team') return null;

  const key = metric || feature || 'general';
  const copy = FEATURE_COPY[key] || FEATURE_COPY.general;
  const pro = PLANS.find(p => p.id === 'pro')!;
  const timeUntilReset = limitInfo?.resetsAt ? formatTimeUntilReset(limitInfo.resetsAt) : null;
  const monthly = (pro.priceMonthly / 1).toFixed(0);
  const yearlyPerMonth = (pro.priceYearly / 12).toFixed(0);

  if (variant === 'banner') {
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-bloom)08 0%, var(--color-ember)08 100%)',
          borderBottom: '1px solid var(--color-bloom)20',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-bloom)20' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              {copy.headline}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
              Upgrade to Pro for ${monthly}/mo · unlimited AI, cloud sync, all connectors
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            Upgrade
            <ArrowRight className="w-3 h-3" />
          </Link>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded transition-colors hover:bg-[var(--color-surface)]"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div
          className="relative w-full max-w-md rounded-[var(--radius-xl)] border overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-2xl)',
          }}
        >
          <div
            className="relative px-6 pt-8 pb-6 text-center"
            style={{
              background: 'linear-gradient(180deg, var(--color-bloom)10 0%, transparent 100%)',
            }}
          >
            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-3 right-3 p-1.5 rounded-full transition-colors hover:bg-[var(--color-surface-dim)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
              </button>
            )}
            <div
              className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: 'var(--color-bloom)20' }}
            >
              <Crown className="w-7 h-7" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
              {copy.headline}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {copy.sub}
            </p>
          </div>
          <div className="px-6 pb-6">
            <ul className="space-y-2.5 mb-6">
              {copy.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--color-bloom)15' }}
                  >
                    <b.icon className="w-3 h-3" style={{ color: 'var(--color-bloom)' }} />
                  </div>
                  <span style={{ color: 'var(--color-ink)' }}>{b.text}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>${monthly}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>/month</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
                or ${yearlyPerMonth}/mo yearly
              </span>
            </div>
            <Link
              href="/pricing"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
            </Link>
            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="w-full mt-2 py-2 text-xs font-medium transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-[var(--radius-xl)] border overflow-hidden ${compact ? 'p-4' : 'p-6'}`}
      style={{
        borderColor: 'var(--color-bloom)30',
        background: 'linear-gradient(135deg, var(--color-bloom)06 0%, var(--color-ember)06 100%)',
      }}
    >
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded transition-colors hover:bg-[var(--color-surface)]"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
        </button>
      )}
      <div className="flex items-start gap-4">
        <div
          className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: 'var(--color-bloom)15' }}
        >
          <Crown className={compact ? 'w-4 h-4' : 'w-5 h-5'} style={{ color: 'var(--color-bloom)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-sm' : 'text-base'} font-bold mb-1`} style={{ color: 'var(--color-ink)' }}>
            {copy.headline}
          </p>
          <p className={`${compact ? 'text-xs' : 'text-sm'} mb-3`} style={{ color: 'var(--color-text-secondary)' }}>
            {copy.sub}
          </p>
          {!compact && (
            <ul className="space-y-1.5 mb-4">
              {copy.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                  <span style={{ color: 'var(--color-ink)' }}>{b.text}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Pro · ${monthly}/mo
              <ArrowRight className="w-3 h-3" />
            </Link>
            {timeUntilReset && reason === 'limit' && (
              <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                or wait {timeUntilReset} for free reset
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LimitReachedProps {
  metric: UsageMetric;
  limitInfo: LimitInfo;
  action?: string;
}

export function LimitReached({ metric, limitInfo, action = 'continue' }: LimitReachedProps) {
  const { plan } = usePlan();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!limitInfo.resetsAt) return;
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [limitInfo.resetsAt]);

  if (!limitInfo.isExhausted) return null;

  const timeLeft = limitInfo.resetsAt ? formatTimeUntilReset(limitInfo.resetsAt) : 'a while';

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-10 rounded-[var(--radius-xl)] border-2 border-dashed mx-auto max-w-md w-full"
      style={{
        borderColor: 'var(--color-pulse)40',
        backgroundColor: 'var(--color-pulse)05',
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-pulse)15' }}
      >
        <Clock className="w-7 h-7" style={{ color: 'var(--color-pulse)' }} />
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
        You've used all {limitInfo.limit} free {limitInfo.noun}s
      </h3>
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
        Free plan resets in <span className="font-semibold" style={{ color: 'var(--color-pulse)' }}>{timeLeft}</span>.
        Or skip the wait with Pro — unlimited {limitInfo.noun}s, all features unlocked.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
          style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
        >
          <Sparkles className="w-4 h-4" />
          Upgrade to Pro
        </Link>
        <a
          href={`/pricing#${plan}`}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all border"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
        >
          See plans
        </a>
      </div>
      <div
        className="mt-5 flex items-center gap-1.5 text-[10px]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <Shield className="w-3 h-3" />
        <span>You won't be charged automatically. Free plan still works.</span>
      </div>
    </div>
  );
}

interface UsageMeterProps {
  metric?: UsageMetric;
  limitInfo: LimitInfo;
  showLabel?: boolean;
  compact?: boolean;
}

export function UsageMeter({ metric, limitInfo, showLabel = true, compact = false }: UsageMeterProps) {
  if (limitInfo.isUnlimited) {
    return (
      <div className="flex items-center gap-1.5 text-[11px]">
        <InfinityIcon className="w-3 h-3" style={{ color: 'var(--color-bloom)' }} />
        <span style={{ color: 'var(--color-text-secondary)' }}>Unlimited</span>
      </div>
    );
  }

  const isWarning = limitInfo.percent >= 80 && limitInfo.percent < 100;
  const isDanger = limitInfo.isExhausted;
  const barColor = isDanger
    ? 'var(--color-pulse)'
    : isWarning
    ? 'var(--color-ember)'
    : 'var(--color-bloom)';

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: 'var(--color-text-secondary)' }}>{limitInfo.name}</span>
          <span
            className="font-semibold"
            style={{ color: isDanger ? 'var(--color-pulse)' : 'var(--color-ink)' }}
          >
            {limitInfo.used} / {limitInfo.limit}
          </span>
        </div>
      )}
      <div
        className={`w-full ${compact ? 'h-1' : 'h-1.5'} rounded-full overflow-hidden`}
        style={{ backgroundColor: 'var(--color-surface-dim)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${limitInfo.percent}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
