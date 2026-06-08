import { supabase } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let cachedToken: string | null = null;
let cachedTokenExp = 0;

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (cachedToken && Date.now() < cachedTokenExp - 60_000) return cachedToken;
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      cachedTokenExp = session.expires_at ? session.expires_at * 1000 : Date.now() + 50 * 60_000;
      return cachedToken;
    }
  } catch {}
  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || body?.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

export async function apiFetchServer<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || body?.error || `Request failed: ${response.status}`);
  }

  return response.json();
}
