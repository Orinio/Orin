import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client — uses the service role key to bypass RLS.
 * 
 * ONLY use this in trusted server-side code (API routes, server actions).
 * NEVER expose this client to the browser or use it in client components.
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY env var to be set.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase admin credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.',
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
