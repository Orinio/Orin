import type { UserRole } from './types';
import type { SubscriptionPlanId } from './chat-types';

export type { UserRole };
export type { SubscriptionPlanId };

const PLAN_HIERARCHY: Record<SubscriptionPlanId, number> = {
  free: 0,
  pro: 1,
  team: 2,
  university: 3,
};

interface RoutePermission {
  roles: UserRole[];
  minPlan?: SubscriptionPlanId;
}

export const ROUTE_PERMISSIONS: Record<string, RoutePermission> = {
  '/dashboard': { roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
  '/dashboard/admin': { roles: ['admin'] },
  '/dashboard/university': { roles: ['university', 'admin'], minPlan: 'team' },
  '/dashboard/team': { roles: ['user', 'university', 'admin', 'moderator'], minPlan: 'team' },
  '/dashboard/billing': { roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
  '/employer': { roles: ['employer', 'admin'] },
  '/opportunities': { roles: ['user', 'university', 'admin', 'moderator'] },
  '/settings': { roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
  '/notifications': { roles: ['user', 'employer', 'university', 'admin', 'moderator'] },
};

function matchRoute(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/')) pattern = pattern.slice(0, -1);
  return pathname === pattern || pathname.startsWith(pattern + '/');
}

export function canAccessRoute(
  role: UserRole,
  plan: SubscriptionPlanId,
  pathname: string
): boolean {
  for (const [pattern, perm] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchRoute(pathname, pattern)) {
      const roleOk = perm.roles.includes(role);
      if (!roleOk) return false;
      if (perm.minPlan && PLAN_HIERARCHY[plan] < PLAN_HIERARCHY[perm.minPlan]) return false;
      return true;
    }
  }
  return true;
}

export function getDenyingRoute(
  role: UserRole,
  pathname: string
): string | null {
  for (const [pattern, perm] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchRoute(pathname, pattern) && !perm.roles.includes(role)) {
      return pattern;
    }
  }
  return null;
}

export function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case 'employer':
      return '/employer/portal';
    case 'university':
      return '/dashboard/university';
    default:
      return '/dashboard';
  }
}

interface NavItem {
  roles?: UserRole[];
  plans?: SubscriptionPlanId[];
  [key: string]: unknown;
}

export function filterNavByRole<T extends NavItem>(
  items: T[],
  role: UserRole,
  plan: SubscriptionPlanId
): T[] {
  return items.filter((item) => {
    if (item.roles && !item.roles.includes(role)) return false;
    if (item.plans && !item.plans.includes(plan)) return false;
    return true;
  });
}

export function requireRole(allowedRoles: UserRole[], userRole: UserRole | null | undefined): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
