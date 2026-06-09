'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle,
  CheckCircle,
  Eye,
  Briefcase,
  Sparkles,
  Clock,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

interface ActivityEvent {
  id: string;
  type: 'proof_created' | 'proof_verified' | 'profile_viewed' | 'opportunity_matched' | 'ai_chat' | 'source_connected';
  title: string;
  description: string;
  timestamp: Date;
  link?: string;
  metadata?: Record<string, unknown>;
}

const EVENT_CONFIG: Record<string, { icon: typeof PlusCircle; color: string; bgColor: string }> = {
  proof_created: { icon: PlusCircle, color: 'var(--color-bloom)', bgColor: 'var(--color-bloom)12' },
  proof_verified: { icon: CheckCircle, color: 'var(--color-bloom)', bgColor: 'var(--color-bloom)12' },
  profile_viewed: { icon: Eye, color: 'var(--color-ember)', bgColor: 'var(--color-ember)12' },
  opportunity_matched: { icon: Briefcase, color: 'var(--color-pulse)', bgColor: 'var(--color-pulse)12' },
  ai_chat: { icon: Sparkles, color: '#6366f1', bgColor: '#6366f112' },
  source_connected: { icon: ExternalLink, color: 'var(--color-spark)', bgColor: 'var(--color-spark)12' },
};

function TimelineEvent({ event, index }: { event: ActivityEvent; index: number }) {
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.proof_created;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="relative flex gap-4"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="h-4 w-4" style={{ color: config.color }} />
        </div>
        <div className="mt-1 h-full w-px" style={{ backgroundColor: 'var(--color-border)' }} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              {event.title}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {event.description}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>
        {event.link && (
          <Link
            href={event.link}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: config.color }}
          >
            View <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

interface ActivityTimelineProps {
  dbUserId: string;
}

export default function ActivityTimeline({ dbUserId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!supabase) return;

      try {
        const allEvents: ActivityEvent[] = [];

        // Fetch recent proofs
        const { data: proofs } = await supabase
          .from('proof_cards')
          .select('id, title, source_type, verification_status, created_at')
          .eq('user_id', dbUserId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (proofs) {
          proofs.forEach((p) => {
            allEvents.push({
              id: `proof-${p.id}`,
              type: p.verification_status === 'verified' ? 'proof_verified' : 'proof_created',
              title: p.verification_status === 'verified' ? `Proof verified: ${p.title}` : `Created: ${p.title}`,
              description: `${p.source_type} proof card`,
              timestamp: new Date(p.created_at),
              link: `/dashboard/proof/${p.id}`,
            });
          });
        }

        // Fetch recent notifications as activity
        const { data: notifs } = await supabase
          .from('notifications')
          .select('id, type, title, body, created_at, link')
          .eq('user_id', dbUserId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (notifs) {
          notifs.forEach((n) => {
            let eventType: ActivityEvent['type'] = 'profile_viewed';
            if (n.type === 'opportunity_match') eventType = 'opportunity_matched';
            else if (n.type === 'verification_update') eventType = 'proof_verified';
            else if (n.type === 'coach_tip') eventType = 'ai_chat';
            else if (n.type === 'recruiter_view') eventType = 'profile_viewed';

            allEvents.push({
              id: `notif-${n.id}`,
              type: eventType,
              title: n.title,
              description: n.body || '',
              timestamp: new Date(n.created_at),
              link: n.link || undefined,
            });
          });
        }

        // Sort by timestamp, most recent first
        allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Deduplicate by title
        const seen = new Set<string>();
        const unique = allEvents.filter((e) => {
          if (seen.has(e.title)) return false;
          seen.add(e.title);
          return true;
        });

        setEvents(unique.slice(0, 8));
      } catch (e) {
        console.warn('Failed to fetch activity:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [dbUserId]);

  if (loading) {
    return (
      <div className="card-premium p-5">
        <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
        <div className="mt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-9 w-9 rounded-xl" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                <div className="h-2 w-1/2 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card-premium p-5">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Recent Activity</h2>
        <div className="mt-6 flex flex-col items-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
            <Clock className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>No activity yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Your recent actions will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-premium p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Recent Activity</h2>
        <Link
          href="/dashboard/analytics"
          className="text-xs font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--color-bloom)' }}
        >
          View all
        </Link>
      </div>
      <div className="space-y-0">
        {events.map((event, i) => (
          <TimelineEvent key={event.id} event={event} index={i} />
        ))}
      </div>
    </div>
  );
}
