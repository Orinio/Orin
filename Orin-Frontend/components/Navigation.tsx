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
  ShieldCheck,
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase },
    { href: '/dashboard/proof/new', label: 'Add Proofs', icon: ShieldCheck },
    { href: '/dashboard/sources/new', label: 'Add Source', icon: PlusCircle },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-black/[0.06]"
      style={{
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo variant="full" size="md" href="/dashboard" />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-[0.97]',
                    isActive(link.href)
                      ? 'text-slate-900 bg-black/[0.06]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.04]',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserMenuOpen(false);
                }}
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

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-[340px] rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.06] bg-white/90 backdrop-blur-xl overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
                    <h3 className="text-[13px] font-bold text-slate-800">
                      Notifications
                    </h3>
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
                        <p className="text-[12px] font-medium text-slate-400">
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
                            'block px-4 py-3 transition-all duration-150 hover:bg-black/[0.03] border-b border-black/[0.04] last:border-0',
                            !n.readAt && 'bg-[var(--color-bloom)]/[0.04]',
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            {!n.readAt && (
                              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[var(--color-pulse)]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold text-slate-800 truncate">
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="text-[11px] mt-0.5 line-clamp-2 text-slate-500 leading-relaxed">
                                  {n.body}
                                </p>
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
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full transition-all duration-200 hover:bg-black/[0.04] active:scale-[0.97]"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden bg-[var(--color-bloom)]">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={fullName} width={32} height={32} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(fullName || 'U')
                  )}
                </div>
                <span className="hidden md:inline text-[13px] font-semibold text-slate-700 max-w-[120px] truncate">
                  {fullName || 'User'}
                </span>
                <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-[220px] rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.06] bg-white/90 backdrop-blur-xl overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                  }}
                >
                  <div className="px-4 py-3 border-b border-black/[0.06]">
                    <p className="text-[13px] font-bold text-slate-800 truncate">
                      {fullName || 'User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 hover:bg-black/[0.04] text-slate-700 mx-1 rounded-xl"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 hover:bg-black/[0.04] text-slate-700 mx-1 rounded-xl"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-black/[0.06] py-1.5">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 hover:bg-red-50 text-red-600 mx-1 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-black/[0.04] active:scale-[0.95]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="relative w-5 h-5 text-slate-700">
                <span
                  className={`absolute left-0 block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-out ${
                    mobileOpen ? 'top-[7px] rotate-45' : 'top-[2px]'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-out ${
                    mobileOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-out ${
                    mobileOpen ? 'top-[7px] -rotate-45' : 'top-[12px]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            WebkitBackdropFilter: mobileOpen ? 'blur(4px)' : undefined,
            backdropFilter: mobileOpen ? 'blur(4px)' : undefined,
          }}
        />
        <div
          className={`absolute top-0 right-0 bottom-0 w-[min(85vw,320px)] bg-white/90 shadow-[-8px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backdropFilter: 'blur(20px) saturate(180%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-black/[0.06]">
              <Logo variant="full" size="md" href="/dashboard" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 hover:bg-black/[0.04] transition-all duration-200 active:scale-[0.95]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-150 active:scale-[0.98]',
                        isActive(link.href)
                          ? 'text-slate-900 bg-black/[0.06]'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-black/[0.04]',
                      )}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile User Info */}
            <div className="px-5 pb-8 pt-6 border-t border-black/[0.06]">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden bg-[var(--color-bloom)]">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={fullName} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(fullName || 'U')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{fullName || 'User'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[13px] font-bold rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-200 active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
