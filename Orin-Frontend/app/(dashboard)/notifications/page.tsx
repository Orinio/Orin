'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

const typeConfig: Record<
  Notification['type'],
  { icon: typeof Bell; color: string; bg: string }
> = {
  recruiter_view: {
    icon: Bell,
    color: 'var(--color-ember)',
    bg: 'var(--color-ember)12',
  },
  verification_update: {
    icon: CheckCheck,
    color: 'var(--color-bloom)',
    bg: 'var(--color-bloom)12',
  },
  opportunity_match: {
    icon: Bell,
    color: 'var(--color-pulse)',
    bg: 'var(--color-pulse)12',
  },
  coach_tip: {
    icon: Bell,
    color: 'var(--color-spark)',
    bg: 'var(--color-spark)12',
  },
  weekly_summary: {
    icon: Bell,
    color: 'var(--color-ember)',
    bg: 'var(--color-ember)12',
  },
  system: {
    icon: Bell,
    color: 'var(--color-text-tertiary)',
    bg: 'var(--color-surface-dim)',
  },
};

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="card-premium flex items-start gap-4 p-4"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
            <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
            <div className="h-3 w-1/3 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onTriggerDemo }: { onTriggerDemo: () => void }) {
  return (
    <div className="card-premium flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
        <Bell size={28} style={{ color: 'var(--color-bloom)' }} />
      </div>
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
        No notifications yet
      </h3>
      <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        When you get notifications, they&apos;ll show up here. Things like recruiter views, verification updates, and more.
      </p>
      <button onClick={onTriggerDemo} className="btn-outline mt-6 px-5 py-2.5 text-sm">
        Create sample notifications
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const { user: authUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const items: Notification[] = (data.notifications || []).map(
          (n: Record<string, unknown>) => ({
            id: n.id as string,
            userId: n.user_id as string,
            type: n.type as Notification['type'],
            title: n.title as string,
            body: (n.body as string) ?? undefined,
            link: (n.link as string) ?? undefined,
            payload: (n.payload as Record<string, unknown>) || {},
            createdAt: new Date(n.created_at as string),
            readAt: n.read_at ? new Date(n.read_at as string) : undefined,
          } as Notification)
        );
        setNotifications(items);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() }))
      );
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.readAt) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date() } : n))
      );
      fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => {});
    }
  };

  const handleTriggerDemo = async () => {
    if (!supabase || !authUser) return;
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      if (!userData) return;

      const demoNotifications = [
        { user_id: userData.id, type: 'system' as const, title: 'Welcome to Orin!', body: 'Start by adding your first proof of work to build your career portfolio.', link: '/dashboard/sources/new', payload: { event: 'welcome' } },
        { user_id: userData.id, type: 'coach_tip' as const, title: 'Pro tip: Add multiple sources', body: 'The more sources you connect, the better your AI career coach can advise you.', link: '/dashboard/sources/new', payload: { event: 'tip' } },
        { user_id: userData.id, type: 'opportunity_match' as const, title: 'New opportunity matched!', body: 'We found 5 new internships that match your skills. Check them out!', link: '/opportunities', payload: { event: 'match', count: 5 } },
      ];

      await supabase.from('notifications').insert(demoNotifications);

      // Re-fetch notifications
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(
          data.map((n) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type as Notification['type'],
            title: n.title,
            body: n.body ?? undefined,
            link: n.link ?? undefined,
            payload: n.payload || {},
            createdAt: new Date(n.created_at),
            readAt: n.read_at ? new Date(n.read_at) : undefined,
          } as Notification))
        );
      }
    } catch (e) {
      console.warn('Failed to create demo notifications:', e);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-center justify-between animate-fadeInUp">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
            Notifications
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn-outline inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
          >
            <CheckCheck size={16} />
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </header>

      {loading ? (
        <NotificationSkeleton />
      ) : notifications.length === 0 ? (
        <EmptyState onTriggerDemo={handleTriggerDemo} />
      ) : (
        <div className="space-y-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            const isUnread = !notification.readAt;

            return (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                type="button"
                className="flex w-full items-start gap-4 p-4 text-left transition-all duration-200"
                style={{
                  border: `1px solid ${isUnread ? 'var(--color-bloom)30' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: isUnread ? 'var(--color-bloom)06' : 'var(--color-surface)',
                }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon size={18} style={{ color: config.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: isUnread ? 'var(--color-ink)' : 'var(--color-text-tertiary)' }}>
                      {notification.title}
                    </p>
                    {isUnread && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
                    )}
                  </div>
                  {notification.body && (
                    <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
