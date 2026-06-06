import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors from provider
  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''}`
    );
  }

  // Create response that will carry cookies
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange authorization code for session (works for OAuth + email confirmation)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return response;
    }

    console.error('Auth callback exchange error:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/signin?error=auth_failed&error_description=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // No code - check if user already has a session (e.g. page refresh)
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return response;
  }

  // Nothing to process - go to signin
  return NextResponse.redirect(`${origin}/signin`);
}
