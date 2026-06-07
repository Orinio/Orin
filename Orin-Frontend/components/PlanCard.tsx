'use client';

import Link from 'next/link';
import { Sparkles, Cloud, HardDrive, Infinity as InfinityIcon, ArrowRight, Crown } from 'lucide-react';
import { usePlan } from '@/lib/plan-context';
import { useUsage } from '@/lib/use-usage';
import { UsageMeter } from './UpgradePrompt';
import { PLAN_LIMITS } from '@/lib/chat-types';

export function PlanCard() {
  const { plan, planDef, isFree, isPro, isTeam, tier } = usePlan();
  const usage = useUsage();
  const limits = PLAN_LIMITS[plan];

  const visibleMetrics = [
    'ai_messages',
    'proof_cards',
    'integrations',
    'opportunity_matches',
  ] as const;

  return (
    <div
      className="rounded-[var(--radius-xl)] border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          background: isFree
            ? 'var(--color-surface-dim)'
            : 'linear-gradient(135deg, var(--color-bloom)12 0%, var(--color-ember)10 100%)',
        }}
      >
        <div
          className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isFree ? 'var(--color-surface)' : 'var(--color-bloom)20',
          }}
        >
          {isFree ? (
            <HardDrive className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <Crown className="w-5 h-5" style={{ color: 'var(--color-bloom)' }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{planDef.name} plan</h3>
            {isPro && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
              >
                Pro
              </span>
            )}
          </div>
          <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {tier === 'local' ? (
              <>
                <HardDrive className="w-2.5 h-2.5" />
                Saved on this device
              </>
            ) : (
              <>
                <Cloud className="w-2.5 h-2.5" />
                Synced to cloud
              </>
            )}
          </p>
        </div>
        {isFree && (
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            <Sparkles className="w-3 h-3" />
            Upgrade
          </Link>
        )}
      </div>

      <div className="p-5 space-y-4">
        {visibleMetrics.map(metric => {
          const info = usage.get(metric);
          return (
            <div key={metric}>
              <UsageMeter limitInfo={info} />
            </div>
          );
        })}

        {isFree && (
          <>
            <div
              className="pt-3 mt-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Unlocks with Pro
              </p>
              <ul className="space-y-1.5">
                {planDef.features
                  .filter(f => !f.included)
                  .slice(0, 3)
                  .map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
                      {f.text}
                    </li>
                  ))}
              </ul>
            </div>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-1 w-full py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
            >
              See all Pro features
              <ArrowRight className="w-3 h-3" />
            </Link>
          </>
        )}

        {(isPro || isTeam) && (
          <Link
            href="/billing"
            className="flex items-center justify-center gap-1 w-full py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
          >
            Manage subscription
          </Link>
        )}
      </div>
    </div>
  );
}
