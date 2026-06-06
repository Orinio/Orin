import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''}`
    );
  }

  if (code) {
    // Create response first
    const response = NextResponse.redirect(new URL(next, origin));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Set cookies on request for the exchange to read
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Set cookies on response to send to browser
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return response;
    }

    console.error('Auth callback exchange error:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/signin?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // No code - check if there's already a session (user might be clicking callback link again)
  // Just redirect to dashboard or signin
  return NextResponse.redirect(`${origin}/signin?error=no_code`);
}
