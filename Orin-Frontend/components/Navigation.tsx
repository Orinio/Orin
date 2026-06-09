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
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Home,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Notification } from '@/lib/types';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, signOut: authSignOut } = useAuth();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
            updatedAt: new Date(n.updated_at),
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
              updatedAt: new Date(n.updated_at as string),
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
    { href: '/dashboard/ai-chat', label: 'AI Chat', icon: Sparkles },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { href: '/dashboard/proof/new', label: 'Add Proofs', icon: ShieldCheck },
    { href: '/dashboard/sources/new', label: 'Add Source', icon: PlusCircle },
  ];

  const bottomLinks = [
    { href: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR
          ═══════════════════════════════════════════ */}
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 left-0 z-40 h-screen flex-col',
          'bg-white/80 backdrop-blur-xl border-r border-black/[0.06]',
          'transition-all duration-300 ease-out',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
        style={{
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Logo + Toggle */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-black/[0.04]',
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
              className="hidden absolute -right-3 top-5 z-50 items-center justify-center w-6 h-6 rounded-full bg-white border border-black/[0.08] shadow-sm text-slate-400 hover:text-slate-700 hover:bg-black/[0.02] transition-all duration-200 active:scale-95"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Primary Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-bloom)]" />
                  )}
                  <Icon className={cn(
                    'flex-shrink-0 transition-colors duration-200',
                    collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                    active ? 'text-[var(--color-bloom)]' : 'text-slate-400 group-hover:text-slate-600',
                  )} />
                  {!collapsed && <span className="truncate">{link.label}</span>}

                  {/* Tooltip when collapsed */}
                  {collapsed && hoveredItem === link.href && (
                    <div className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
                      {link.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 mx-2 h-px bg-black/[0.06]" />

          {/* Secondary Nav */}
          <div className="space-y-1">
            {bottomLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              const isNotif = link.href === '/notifications';
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
                    >
                      <div className="relative flex-shrink-0">
                        <Icon className={cn(
                          'transition-colors duration-200',
                          collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                          active ? 'text-[var(--color-bloom)]' : 'text-slate-400 group-hover:text-slate-600',
                        )} />
                        {link.badge && link.badge > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white rounded-full bg-[var(--color-pulse)] shadow-sm">
                            {link.badge > 9 ? '9+' : link.badge}
                          </span>
                        )}
                      </div>
                      {!collapsed && <span className="truncate">{link.label}</span>}

                      {collapsed && hoveredItem === link.href && (
                        <div className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
                          {link.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
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
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-bloom)]" />
                      )}
                      <Icon className={cn(
                        'flex-shrink-0 transition-colors duration-200',
                        collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                        active ? 'text-[var(--color-bloom)]' : 'text-slate-400 group-hover:text-slate-600',
                      )} />
                      {!collapsed && <span className="truncate">{link.label}</span>}

                      {collapsed && hoveredItem === link.href && (
                        <div className="absolute left-full ml-3 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg pointer-events-none">
                          {link.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Notifications Panel (desktop popover) */}
        {notifOpen && (
          <div
            className={cn(
              'fixed z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] overflow-hidden animate-pop-in',
              collapsed ? 'left-[80px] bottom-24 w-[340px]' : 'left-[268px] bottom-24 w-[340px]',
            )}
            style={{
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              backdropFilter: 'blur(24px) saturate(180%)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
              <h3 className="text-[13px] font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
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
                    onClick={() => setNotifOpen(false)}
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
        )}

        {/* User Section */}
        <div className={cn(
          'border-t border-black/[0.04] p-3',
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
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-medium whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {fullName || 'User'}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="px-2 py-1 rounded-lg bg-white shadow-lg ring-1 ring-black/[0.08] space-y-1 w-[140px]">
                  <Link href="/settings" className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-black/[0.04] rounded-md transition-colors">
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
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
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE HEADER (top bar)
          ═══════════════════════════════════════════ */}
      <header
        className="lg:hidden sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-black/[0.06]"
        style={{
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <Logo variant="mark" size="sm" href="/dashboard" />
          <div className="flex items-center gap-2">
            {/* Mobile notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:bg-black/[0.04] active:scale-[0.95]"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="w-[18px] h-[18px] text-slate-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white rounded-full bg-[var(--color-pulse)] shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
            {/* Mobile user avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden bg-[var(--color-bloom)]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={fullName} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                getInitials(fullName || 'U')
              )}
            </div>
          </div>
        </div>

        {/* Mobile Notifications Panel */}
        {notifOpen && (
          <div
            className="lg:hidden absolute right-4 top-full mt-2 w-[min(90vw,340px)] rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.06] bg-white/95 backdrop-blur-xl overflow-hidden origin-top-right animate-pop-in"
            style={{
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              backdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
              <h3 className="text-[13px] font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-bold hover:opacity-80 text-[var(--color-pulse)]">
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
                    onClick={() => setNotifOpen(false)}
                    className={cn(
                      'block px-4 py-3 transition-all duration-150 hover:bg-black/[0.03] border-b border-black/[0.04] last:border-0',
                      !n.readAt && 'bg-[var(--color-bloom)]/[0.04]',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.readAt && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[var(--color-pulse)]" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-slate-800 truncate">{n.title}</p>
                        {n.body && <p className="text-[11px] mt-0.5 line-clamp-2 text-slate-500 leading-relaxed">{n.body}</p>}
                        <p className="text-[10px] mt-1 font-medium text-slate-400">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM TAB BAR
          ═══════════════════════════════════════════ */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-black/[0.06]"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 -1px 3px rgba(0,0,0,0.04), 0 -4px 12px rgba(0,0,0,0.02)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around h-[68px] px-2">
          {[
            { href: '/dashboard', label: 'Home', icon: Home },
            { href: '/dashboard/ai-chat', label: 'AI Chat', icon: Sparkles },
            { href: '/dashboard/proof/new', label: 'Add', icon: PlusCircle, isCenter: true },
            { href: '/opportunities', label: 'Jobs', icon: Briefcase },
            { href: '/settings', label: 'More', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            if (tab.isCenter) {
              return (
                <Link key={tab.href} href={tab.href} className="relative -mt-5 flex flex-col items-center justify-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)',
                      boxShadow: '0 4px 16px rgba(11,171,119,0.35)',
                    }}
                  >
                    <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="mt-1 text-[10px] font-semibold" style={{ color: 'var(--color-bloom)' }}>
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-all duration-200 active:scale-95"
              >
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200"
                  style={{
                    backgroundColor: active ? 'var(--color-bloom)12' : 'transparent',
                  }}
                >
                  <Icon
                    className="h-5 w-5 transition-colors duration-200"
                    style={{ color: active ? 'var(--color-bloom)' : '#64748b' }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold transition-colors duration-200"
                  style={{ color: active ? 'var(--color-bloom)' : '#64748b' }}
                >
                  {tab.label}
                </span>
                {active && (
                  <div className="h-1 w-1 rounded-full mt-0.5" style={{ backgroundColor: 'var(--color-bloom)' }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
