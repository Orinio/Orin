'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/utils';
import Logo from '@/components/Logo';
import NotificationPanel from './NotificationPanel';
import type { Notification } from '@/lib/types';
import type { UserRole } from '@/lib/types';
import type { SubscriptionPlanId } from '@/lib/chat-types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DesktopSidebarProps {
  navLinks: NavItem[];
  bottomLinks: NavItem[];
  fullName: string;
  avatarUrl: string;
  userEmail?: string;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onSignOut: () => void;
}

export default function DesktopSidebar({
  navLinks,
  bottomLinks,
  fullName,
  avatarUrl,
  userEmail,
  notifications,
  unreadCount,
  onMarkAllRead,
  onSignOut,
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex fixed top-0 left-0 z-40 h-screen flex-col',
        'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
      style={{ boxShadow: '1px 0 3px rgba(0,0,0,0.02)' }}
      aria-label="Sidebar navigation"
    >
      {/* Logo + Toggle */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[var(--color-border)]',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        {!collapsed && <Logo variant="full" size="sm" href="/dashboard" />}
        {collapsed && <Logo variant="mark" size="sm" href="/dashboard" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
            'text-slate-400 hover:text-slate-700 hover:bg-black/[0.04] active:scale-95',
            collapsed && 'hidden',
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden absolute -right-3 top-5 z-50 items-center justify-center w-6 h-6 rounded-full bg-white border border-[var(--color-border)] shadow-sm text-slate-400 hover:text-slate-700 hover:bg-black/[0.02] transition-all duration-200 active:scale-95"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        <div className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200',
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'bg-[var(--color-bloom)]/[0.08] text-[var(--color-bloom)]'
                    : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-800',
                )}
                onMouseEnter={() => collapsed && setHoveredItem(link.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-bloom)]" aria-hidden="true" />
                )}
                <Icon className={cn(
                  'flex-shrink-0 transition-colors duration-200',
                  collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                  active ? 'text-[var(--color-bloom)]' : 'text-slate-400 group-hover:text-slate-600',
                )} />
                {!collapsed && <span className="truncate">{link.label}</span>}
                {collapsed && hoveredItem === link.href && (
                  <div className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none" role="tooltip">
                    {link.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" aria-hidden="true" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div className="my-4 mx-2 h-px bg-[var(--color-border)]" aria-hidden="true" />

        <div className="space-y-1">
          {bottomLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            const isNotif = link.label === 'Notifications';
            return (
              <div key={link.href} className="relative" ref={isNotif ? notifRef : undefined}>
                {isNotif ? (
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200',
                      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                      active
                        ? 'bg-[var(--color-bloom)]/[0.08] text-[var(--color-bloom)]'
                        : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-800',
                    )}
                    onMouseEnter={() => collapsed && setHoveredItem(link.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className={cn(
                        'transition-colors duration-200',
                        collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                        active ? 'text-[var(--color-bloom)]' : 'text-slate-400 group-hover:text-slate-600',
                      )} />
                      {link.badge && link.badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white rounded-full bg-[var(--color-pulse)] shadow-sm" aria-hidden="true">
                          {link.badge > 9 ? '9+' : link.badge}
                        </span>
                      )}
                    </div>
                    {!collapsed && <span className="truncate">{link.label}</span>}
                    {collapsed && hoveredItem === link.href && (
                      <div className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none" role="tooltip">
                        {link.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl text-[13px] font-semibold transition-all duration-200',
                      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                      active
                        ? 'bg-[var(--color-bloom)]/[0.08] text-[var(--color-bloom)]'
                        : 'text-slate-500 hover:bg-black/[0.04] hover:text-slate-800',
                    )}
                    onMouseEnter={() => collapsed && setHoveredItem(link.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-bloom)]" aria-hidden="true" />
                    )}
                    <Icon className={cn(
                      'flex-shrink-0 transition-colors duration-200',
                      collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                      active ? 'text-[var(--color-bloom)]' : 'text-slate-400 group-hover:text-slate-600',
                    )} />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                    {collapsed && hoveredItem === link.href && (
                      <div className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none" role="tooltip">
                        {link.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" aria-hidden="true" />
                      </div>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Notifications Panel */}
      {notifOpen && (
        <div className={cn(
          'fixed z-50 animate-pop-in',
          collapsed ? 'left-[80px] bottom-24 w-[340px]' : 'left-[268px] bottom-24 w-[340px]',
        )}>
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onClose={() => setNotifOpen(false)}
          />
        </div>
      )}

      {/* User Section */}
      <div className={cn(
        'border-t border-[var(--color-border)] p-3',
        collapsed ? 'flex justify-center' : '',
      )}>
        {collapsed ? (
          <div className="relative group">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden bg-[var(--color-bloom)] cursor-pointer">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={fullName} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                getInitials(fullName || 'U')
              )}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" role="tooltip">
              {fullName || 'User'}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="px-2 py-1 rounded-lg bg-white shadow-lg ring-1 ring-black/[0.08] space-y-1 w-[140px]">
                <Link href="/settings" className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-black/[0.04] rounded-md transition-colors">
                  <User className="w-3.5 h-3.5" />
                  Profile
                </Link>
                <button
                  onClick={onSignOut}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs overflow-hidden bg-[var(--color-bloom)]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={fullName} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                getInitials(fullName || 'U')
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-800 truncate">{fullName || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
            </div>
            <button
              onClick={onSignOut}
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-95"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
