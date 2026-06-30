'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  Briefcase,
  PlusCircle,
  Settings,
  Bell,
  User,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Home,
  Crown,
  Users,
  GraduationCap,
  Target,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRole } from '@/lib/role-context';
import { usePlan } from '@/lib/plan-context';
import { filterNavByRole } from '@/lib/permissions';
import type { UserRole } from '@/lib/types';
import type { SubscriptionPlanId } from '@/lib/chat-types';
import type { Notification } from '@/lib/types';
import { DesktopSidebar, MobileHeader, MobileBottomTabs } from './nav';

export default function Navigation() {
  const router = useRouter();
  const { user: authUser, signOut: authSignOut } = useAuth();
  const { role: userRole } = useRole();
  const { plan: userPlan } = usePlan();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const allNavLinks: { href: string; label: string; icon: typeof LayoutGrid; roles: UserRole[]; plans?: SubscriptionPlanId[] }[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/feed', label: 'Feed', icon: Home, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/ai-chat', label: 'AI Chat', icon: Sparkles, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/skill-gap', label: 'Skill Gaps', icon: Target, roles: ['user', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, roles: ['user', 'employer', 'university', 'admin'] },
    { href: '/dashboard/network', label: 'Network', icon: User, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/opportunities', label: 'Opportunities', icon: Briefcase, roles: ['user', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/proof/new', label: 'Add Proofs', icon: ShieldCheck, roles: ['user', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/sources/new', label: 'Add Source', icon: PlusCircle, roles: ['user', 'university', 'admin', 'moderator'] },
  ];

  const allBottomLinks: { href: string; label: string; icon: typeof Bell; badge?: number; roles: UserRole[]; plans?: SubscriptionPlanId[] }[] = [
    { href: '/dashboard/messages', label: 'Messages', icon: Bell, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/billing', label: 'Billing', icon: Crown, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/dashboard/team', label: 'Team', icon: Users, roles: ['user', 'university', 'admin'], plans: ['team', 'university'] },
    { href: '/dashboard/university', label: 'University', icon: GraduationCap, roles: ['university', 'admin'] },
    { href: '/employer/portal', label: 'Employer Portal', icon: Briefcase, roles: ['employer', 'admin'] },
    { href: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
    { href: '/settings', label: 'Settings', icon: Settings, roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
  ];

  const navLinks = filterNavByRole(allNavLinks, userRole, userPlan);
  const bottomLinks = filterNavByRole(allBottomLinks, userRole, userPlan);

  return (
    <>
      <DesktopSidebar
        navLinks={navLinks}
        bottomLinks={bottomLinks}
        fullName={fullName}
        avatarUrl={avatarUrl}
        userEmail={user?.email}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onSignOut={handleSignOut}
      />
      <MobileHeader
        fullName={fullName}
        avatarUrl={avatarUrl}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
      />
      <MobileBottomTabs />
    </>
  );
}
