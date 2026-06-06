import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''}`
    );
  }

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

  // Handle OAuth code exchange (PKCE flow)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return response;
    }

    console.error('Auth callback exchange error:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/signin?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Handle email confirmation (magic link / signup confirmation)
  // Supabase sends token + type=signup or type=magiclink
  if (token && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token,
      type: type as 'signup' | 'magiclink' | 'recovery',
    });

    if (!verifyError) {
      return NextResponse.redirect(new URL('/signin?confirmed=email', origin));
    }

    console.error('Auth callback verify error:', verifyError.message);
    return NextResponse.redirect(
      `${origin}/signin?error=verify_failed&error_description=${encodeURIComponent(verifyError.message)}`
    );
  }

  // No code or token - check if there's already a session
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    return response;
  }

  // No session, no code - redirect to signin
  return NextResponse.redirect(`${origin}/signin`);
}
