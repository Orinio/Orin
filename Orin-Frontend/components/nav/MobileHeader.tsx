'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/utils';
import Logo from '@/components/Logo';
import NotificationPanel from './NotificationPanel';
import type { Notification } from '@/lib/types';

interface MobileHeaderProps {
  fullName: string;
  avatarUrl: string;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
}

export default function MobileHeader({
  fullName,
  avatarUrl,
  notifications,
  unreadCount,
  onMarkAllRead,
}: MobileHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="lg:hidden sticky top-0 z-50 w-full bg-[var(--color-surface)] border-b border-[var(--color-border)]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <Logo variant="mark" size="sm" href="/dashboard" />
        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:bg-black/[0.04] active:scale-[0.95]"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-[18px] h-[18px] text-slate-500" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white rounded-full bg-[var(--color-pulse)] shadow-sm" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="lg:hidden absolute right-0 top-full mt-2 w-[min(90vw,340px)] origin-top-right animate-pop-in">
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAllRead={onMarkAllRead}
                  onClose={() => setNotifOpen(false)}
                />
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden bg-[var(--color-bloom)]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={fullName} width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              getInitials(fullName || 'U')
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
