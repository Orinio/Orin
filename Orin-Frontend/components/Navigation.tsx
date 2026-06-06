'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  LayoutGrid,
  Briefcase,
  PlusCircle,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Check,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Notification } from '@/lib/types';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, signOut: authSignOut } = useAuth();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('auth_user_id', authUser.id)
          .single();
        if (data) {
          setFullName(data.full_name || authUser.email?.split('@')[0] || 'User');
          setAvatarUrl(data.avatar_url || '');
        }
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    const sb = supabase;

    const fetchNotifications = async () => {
      const { data } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
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
            readAt: n.read_at ? new Date(n.read_at) : undefined,
            createdAt: new Date(n.created_at),
          })),
        );
      }
    };
    fetchNotifications();

    const channel = supabase
      .channel('nav-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Record<string, unknown>;
          setNotifications((prev) => [
            {
              id: n.id as string,
              userId: n.user_id as string,
              type: n.type as Notification['type'],
              title: n.title as string,
              body: (n.body as string) ?? undefined,
              link: (n.link as string) ?? undefined,
              payload: (n.payload as Record<string, unknown>) || {},
              readAt: n.read_at ? new Date(n.read_at as string) : undefined,
              createdAt: new Date(n.created_at as string),
            },
            ...prev,
          ]);
        },
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markAllRead = async () => {
    if (!supabase || !user) return;
    const now = new Date().toISOString();
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', user.id)
      .is('read_at', null);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
  };

  const handleSignOut = async () => {
    await authSignOut();
    router.push('/signin');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/dashboard/ai-agents', label: 'AI Agents', icon: Sparkles },
    { href: '/dashboard/ai-chat', label: 'AI Chat', icon: MessageCircle },
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { href: '/dashboard/sources/new', label: 'Add Source', icon: PlusCircle },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full bg-glass border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[var(--color-ink)]">
              <span className="text-sm font-bold" style={{ color: 'var(--color-spark)' }}>O</span>
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              ORIN
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200',
                    isActive(link.href)
                      ? 'text-[var(--color-ink)] bg-[var(--color-surface-dim)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserMenuOpen(false);
                }}
                className="relative flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface-dim)]"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full" style={{ backgroundColor: 'var(--color-pulse)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-[var(--radius-xl)] shadow-2xl border overflow-hidden bg-[var(--color-surface)] border-[var(--color-border)]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-80"
                        style={{ color: 'var(--color-pulse)' }}
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--color-mist)' }} />
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || '#'}
                          onClick={() => setNotifOpen(false)}
                          className={cn(
                            'block px-4 py-3 transition-colors hover:bg-[var(--color-surface-dim)] border-b border-[var(--color-border)] last:border-0',
                            !n.readAt && 'bg-[var(--color-surface-dim)]',
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!n.readAt && (
                              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: 'var(--color-pulse)' }} />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                                  {n.body}
                                </p>
                              )}
                              <p className="text-[10px] mt-1" style={{ color: 'var(--color-mist)' }}>
                                {formatRelativeTime(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface-dim)]"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden" style={{ backgroundColor: 'var(--color-bloom)' }}>
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={fullName} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(fullName || 'U')
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate" style={{ color: 'var(--color-ink)' }}>
                  {fullName || 'User'}
                </span>
                <ChevronDown className="hidden md:block w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-[var(--radius-xl)] shadow-2xl border overflow-hidden bg-[var(--color-surface)] border-[var(--color-border)]">
                  <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                      {fullName || 'User'}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-dim)]"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-dim)]"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-[var(--color-border)] py-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-dim)]"
                      style={{ color: 'var(--color-pulse)' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-[var(--radius-md)] transition-colors hover:bg-[var(--color-surface-dim)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{ color: 'var(--color-ink)' }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'text-[var(--color-ink)] bg-[var(--color-surface-dim)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
