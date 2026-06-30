'use client';

import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClose: () => void;
  className?: string;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClose,
  className,
}: NotificationPanelProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] overflow-hidden animate-pop-in',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
        <h3 className="text-[13px] font-bold text-slate-800">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-bold hover:opacity-80 text-[var(--color-pulse)]"
          >
            <Check className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-[12px] font-medium text-slate-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={n.link || '#'}
              onClick={onClose}
              className={cn(
                'block px-4 py-3 transition-all duration-150 hover:bg-black/[0.03] border-b border-black/[0.04] last:border-0',
                !n.readAt && 'bg-[var(--color-bloom)]/[0.04]',
              )}
            >
              <div className="flex items-start gap-2.5">
                {!n.readAt && (
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[var(--color-pulse)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-slate-800 truncate">{n.title}</p>
                  {n.body && (
                    <p className="text-[11px] mt-0.5 line-clamp-2 text-slate-500 leading-relaxed">{n.body}</p>
                  )}
                  <p className="text-[10px] mt-1 font-medium text-slate-400">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
