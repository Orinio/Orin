'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useFeatureFlags } from '@/lib/feature-flag-context';
import { useAuth } from '@/lib/auth-context';
import type { FeatureFlag } from '@/lib/feature-flags';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPlan?: string;
  requiredFeature?: FeatureFlag;
  fallback?: string;
  showLoading?: boolean;
}

export default function RoleGuard({
  children,
  requiredRoles,
  requiredPlan,
  requiredFeature,
  fallback = '/dashboard',
  showLoading = true,
}: RoleGuardProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasRole, hasPlan, isEnabled, enabledFeatures } = useFeatureFlags();

  const loading = authLoading || enabledFeatures.length === 0;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/signin');
      return;
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
      router.push(fallback);
      return;
    }

    if (requiredPlan && !hasPlan(requiredPlan)) {
      router.push(fallback);
      return;
    }

    if (requiredFeature && !isEnabled(requiredFeature)) {
      router.push(fallback);
      return;
    }
  }, [loading, user, requiredRoles, requiredPlan, requiredFeature, hasRole, hasPlan, isEnabled, router, fallback]);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-bloom)' }} />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRoles && !hasRole(requiredRoles)) return null;
  if (requiredPlan && !hasPlan(requiredPlan)) return null;
  if (requiredFeature && !isEnabled(requiredFeature)) return null;

  return <>{children}</>;
}

export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children'>
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard {...options}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}
