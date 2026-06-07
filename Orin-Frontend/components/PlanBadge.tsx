'use client';

import { usePlan } from '@/lib/plan-context';
import { Sparkles, Cloud, HardDrive } from 'lucide-react';

interface PlanBadgeProps {
  size?: 'sm' | 'md';
  showUpgrade?: boolean;
}

export function PlanBadge({ size = 'sm', showUpgrade = true }: PlanBadgeProps) {
  const { plan, isFree } = usePlan();

  if (isFree) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
        style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
      >
        <HardDrive className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        Free
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <div
        className={`inline-flex items-center gap-1 rounded-full font-semibold ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
        }`}
        style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
      >
        <Sparkles className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        {plan === 'pro' ? 'Pro' : 'Team'}
      </div>
      {showUpgrade && plan !== 'team' && (
        <a
          href="/pricing"
          className={`inline-flex items-center gap-1 font-semibold hover:opacity-80 ${
            size === 'sm' ? 'text-[10px]' : 'text-xs'
          }`}
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          · <Cloud className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} /> cloud sync on
        </a>
      )}
    </div>
  );
}
