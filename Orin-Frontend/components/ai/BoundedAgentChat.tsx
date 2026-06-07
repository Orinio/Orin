'use client';

import { useState } from 'react';
import { AgentChat } from './AgentChat';
import { useUsage } from '@/lib/use-usage';
import { usePlan } from '@/lib/plan-context';
import { LimitReached, UsageMeter, UpgradePrompt } from '@/components/UpgradePrompt';
import { Sparkles, AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BoundedAgentChatProps {
  initialAgent?: string;
}

export function BoundedAgentChat({ initialAgent = 'chat' }: BoundedAgentChatProps) {
  const usage = useUsage();
  const { isFree, plan, planDef } = usePlan();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const aiInfo = usage.get('ai_messages');
  const isExhausted = aiInfo.isExhausted;

  if (isExhausted) {
    return (
      <div className="flex flex-col h-full rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center gap-3" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)12' }}>
            <MessageSquare className="w-4.5 h-4.5" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>AI Coach</h3>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Powered by {planDef.name}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <LimitReached metric="ai_messages" limitInfo={aiInfo} action="chat with AI" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {isFree && aiInfo.percent >= 60 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-lg)] border flex-shrink-0"
          style={{
            borderColor: aiInfo.percent >= 90 ? 'var(--color-pulse)30' : 'var(--color-ember)30',
            backgroundColor: aiInfo.percent >= 90 ? 'var(--color-pulse)05' : 'var(--color-ember)05',
          }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: aiInfo.percent >= 90 ? 'var(--color-pulse)' : 'var(--color-ember)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
              {aiInfo.used} of {aiInfo.limit} free {aiInfo.noun}s used
            </p>
            <div className="mt-1">
              <UsageMeter limitInfo={aiInfo} showLabel={false} compact />
            </div>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-md)] text-[11px] font-semibold transition-all hover:opacity-90 flex-shrink-0"
            style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            <Sparkles className="w-3 h-3" />
            Upgrade
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <AgentChat initialAgent={initialAgent} onMessageSent={() => usage.record('ai_messages')} />
      </div>
    </div>
  );
}
