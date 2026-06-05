'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  CheckCircle,
  Briefcase,
  Lightbulb,
  Calendar,
  Settings,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const typeConfig: Record<
  Notification['type'],
  { icon: typeof Bell; color: string; bg: string }
> = {
  recruiter_view: {
    icon: Eye,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  verification_update: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  opportunity_match: {
    icon: Briefcase,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
  coach_tip: {
    icon: Lightbulb,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  weekly_summary: {
    icon: Calendar,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  system: {
    icon: Settings,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
};

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-4"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--color-neutral-bg)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-neutral-bg)]" />
            <div className="h-3 w-full animate-pulse rounded bg-[var(--color-neutral-bg)]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-neutral-bg)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
        <Bell size={28} className="text-[var(--color-primary-emerald)]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--color-neutral-text)]">
        No notifications yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-neutral-text-secondary)]">
        When you get notifications, they&apos;ll show up here. Things like recruiter views, verification updates, and more.
      </p>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
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
          (n: Notification & { createdAt: string; readAt?: string }) => ({
            ...n,
            createdAt: new Date(n.createdAt),
            readAt: n.readAt ? new Date(n.readAt) : undefined,
          } as Notification)
        );
        setNotifications(items);
      } catch {
        // silently fail — show empty state
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
    // Optimistically mark as read
    if (!notification.readAt) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date() } : n))
      );
      fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => {});
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-2 text-sm font-medium text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)] disabled:opacity-60"
          >
            <CheckCheck size={16} />
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </header>

      {loading ? (
        <NotificationSkeleton />
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.icon;
            const isUnread = !notification.readAt;

            return (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                type="button"
                className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition ${
                  isUnread
                    ? 'border-[var(--color-primary-emerald)]/30 bg-[var(--color-primary-soft)]/50'
                    : 'border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] hover:bg-[var(--color-neutral-bg)]'
                } ${notification.link ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                >
                  <Icon size={18} className={config.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${
                        isUnread
                          ? 'text-[var(--color-neutral-text)]'
                          : 'text-[var(--color-neutral-text-secondary)]'
                      }`}
                    >
                      {notification.title}
                    </p>
                    {isUnread && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary-emerald)]" />
                    )}
                  </div>
                  {notification.body && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--color-neutral-text-tertiary)]">
                      {notification.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-[var(--color-neutral-text-tertiary)]">
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
