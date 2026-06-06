'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/lib/supabase';

const supabase = supabaseClient;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const SESSION_REFRESH_BUFFER_MS = 5 * 60 * 1000;

function noopError() {
  return { error: { name: 'AuthNotConfigured', message: 'Authentication not configured', status: 500 } as AuthError };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
        // Schedule next refresh for the new session
        startSessionRefresh(data.session);
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
    }
  }, []);

  const startSessionRefresh = useCallback((s: Session) => {
    clearRefreshTimer();
    if (s.expires_at) {
      const expiresAt = s.expires_at * 1000;
      const now = Date.now();
      const timeUntilRefresh = Math.max(
        expiresAt - now - SESSION_REFRESH_BUFFER_MS,
        60_000
      );
      // Use setTimeout for one-shot refresh, then schedule the next one
      refreshTimer.current = setTimeout(() => {
        refreshSession();
      }, timeUntilRefresh);
    }
  }, [clearRefreshTimer, refreshSession]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);
      if (session) {
        startSessionRefresh(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitialized(true);
        if (session) {
          startSessionRefresh(session);
        } else {
          clearRefreshTimer();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, startSessionRefresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return noopError();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!supabase) return { ...noopError(), user: null };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { error, user: data?.user ?? null };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    clearRefreshTimer();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  }, [clearRefreshTimer]);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return noopError();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    return { error };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        initialized,
        signIn,
        signUp,
        signInWithOAuth,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
