/**
 * Supabase Client for API Route Handlers
 * Creates a request-scoped client with proper cookie handling
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Supabase client for use in API Route Handlers
 * This properly handles cookies for session management
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const { supabase, response } = createRouteHandlerClient(request);
 *   const { data: { user } } = await supabase.auth.getUser();
 *   // ... use supabase with authenticated user
 *   return response;
 * }
 */
export function createRouteHandlerClient(request: NextRequest) {
  // Create an unmodified response that we can add cookies to
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for reading)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Set cookies on the response (for sending to browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response: supabaseResponse };
}

/**
 * Get authenticated user from API route request
 * Returns user or null, along with the response (to propagate cookie changes)
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const { supabase, response } = createRouteHandlerClient(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error, response };
  }

  return { user, error: null, response };
}

/**
 * Require authentication in API routes
 * Returns authenticated user or throws with proper error response
 */
export async function requireApiAuth(request: NextRequest) {
  const { user, error, response } = await getAuthenticatedUser(request);

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      ),
    };
  }

  return { user, error: null, response };
}
