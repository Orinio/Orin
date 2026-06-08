'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { api } from './api-client';
import { PLANS, type SubscriptionPlanId, type StorageTier, type PlanDefinition } from './chat-types';

const PLAN_CACHE_KEY = 'orin.plan.v1';
const CACHE_DURATION_MS = 60_000;

interface PlanContextValue {
  plan: SubscriptionPlanId;
  tier: StorageTier;
  planDef: PlanDefinition;
  isPro: boolean;
  isTeam: boolean;
  isFree: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  setLocalPlan: (plan: SubscriptionPlanId) => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

interface CachedPlan {
  plan: SubscriptionPlanId;
  cachedAt: number;
}

function readCachedPlan(): SubscriptionPlanId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLAN_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedPlan = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_DURATION_MS) return null;
    return parsed.plan;
  } catch {
    return null;
  }
}

function writeCachedPlan(plan: SubscriptionPlanId) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify({ plan, cachedAt: Date.now() }));
  } catch {}
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlanId>('free');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan('free');
      return;
    }
    setLoading(true);
    try {
      const data = await api.billing.me();
      const p = (data?.plan as SubscriptionPlanId) || 'free';
      setPlan(p);
      writeCachedPlan(p);
    } catch {
      try {
        const { supabase } = await import('./supabase');
        if (supabase) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('auth_user_id', authUser.id)
              .maybeSingle();
            if (userData) {
              const { data: subData } = await supabase
                .from('subscriptions')
                .select('plan')
                .eq('user_id', userData.id)
                .is('deleted_at', null)
                .maybeSingle();
              const p = (subData?.plan as SubscriptionPlanId) || 'free';
              setPlan(p);
              writeCachedPlan(p);
              return;
            }
          }
        }
      } catch {
        // Fall through to cached
      }
      const cached = readCachedPlan();
      setPlan(cached || 'free');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const cached = readCachedPlan();
    if (cached) setPlan(cached);
    if (user) refresh();
    else setPlan('free');
  }, [user, refresh]);

  const setLocalPlan = useCallback((p: SubscriptionPlanId) => {
    setPlan(p);
    writeCachedPlan(p);
  }, []);

  const planDef = PLANS.find(p => p.id === plan) || PLANS[0];
  const tier: StorageTier = plan === 'free' ? 'local' : 'cloud';

  return (
    <PlanContext.Provider
      value={{
        plan,
        tier,
        planDef,
        isPro: plan === 'pro',
        isTeam: plan === 'team',
        isFree: plan === 'free',
        loading,
        refresh,
        setLocalPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}
