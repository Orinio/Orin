'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { supabase as supabaseClient } from './supabase';
import type { UserRole } from './types';

const ROLE_CACHE_KEY = 'orin.role.v1';
const CACHE_DURATION_MS = 120_000;

export interface RoleState {
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleState | undefined>(undefined);

interface CachedRole {
  role: UserRole;
  cachedAt: number;
}

function readCachedRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ROLE_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedRole = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_DURATION_MS) return null;
    return parsed.role;
  } catch {
    return null;
  }
}

function writeCachedRole(role: UserRole) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ role, cachedAt: Date.now() }));
  } catch {}
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRole('user');
      return;
    }
    setLoading(true);
    try {
      // Prefer user_metadata from the auth JWT (fast, no DB query)
      const metaRole = user.user_metadata?.role as UserRole | undefined;
      if (metaRole && ['user', 'admin', 'moderator', 'employer', 'university'].includes(metaRole)) {
        setRole(metaRole);
        writeCachedRole(metaRole);
        return;
      }

      // Fallback: read from users table
      if (supabaseClient) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('role')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (userData?.role) {
          const r = userData.role as UserRole;
          setRole(r);
          writeCachedRole(r);
          return;
        }
      }

      // Final fallback: cached value
      const cached = readCachedRole();
      if (cached) setRole(cached);
    } catch {
      const cached = readCachedRole();
      if (cached) setRole(cached);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const cached = readCachedRole();
    if (cached) setRole(cached);
    if (user) refresh();
    else setRole('user');
  }, [user, refresh]);

  return (
    <RoleContext.Provider value={{ role, loading, refresh }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
}
