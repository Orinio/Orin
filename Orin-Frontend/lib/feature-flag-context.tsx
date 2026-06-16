'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useRole } from './role-context';
import { usePlan } from './plan-context';
import { isFeatureEnabled, getEnabledFeatures, type FeatureFlag } from './feature-flags';

interface FeatureFlagContextValue {
  isEnabled: (flag: FeatureFlag) => boolean;
  enabledFeatures: FeatureFlag[];
  hasRole: (roles: string[]) => boolean;
  hasPlan: (minPlan: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { role } = useRole();
  const { plan } = usePlan();

  const value = useMemo(() => ({
    isEnabled: (flag: FeatureFlag) => isFeatureEnabled(flag, role, plan),
    enabledFeatures: getEnabledFeatures(role, plan),
    hasRole: (roles: string[]) => roles.includes(role),
    hasPlan: (minPlan: string) => {
      const hierarchy: Record<string, number> = { free: 0, pro: 1, team: 2, university: 3 };
      return (hierarchy[plan] || 0) >= (hierarchy[minPlan] || 0);
    },
  }), [role, plan]);

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  return ctx;
}

export function useHasRole(allowedRoles: string[]): boolean {
  const { hasRole } = useFeatureFlags();
  return hasRole(allowedRoles);
}

export function useHasPlan(minPlan: string): boolean {
  const { hasPlan } = useFeatureFlags();
  return hasPlan(minPlan);
}
