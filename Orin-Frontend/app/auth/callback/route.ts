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
    const errorParams = new URLSearchParams({
      error,
      ...(errorDescription ? { error_description: errorDescription } : {}),
    });
    return NextResponse.redirect(`${origin}/signin?${errorParams.toString()}`);
  }

  if (code) {
    const supabaseResponse = NextResponse.next({ request });

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
            supabaseResponse.cookies.set(
              cookiesToSet.map((c) => `${c.name}=${c.value}`).join('; ')
            );
            // For Next.js 14+, we need to set cookies on the response
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Successfully exchanged code for session
      // Redirect to the intended destination or dashboard
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange failed - redirect with error
    console.error('Auth callback exchange error:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/signin?error=exchange_failed&error_description=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // No code provided - redirect to sign in
  return NextResponse.redirect(`${origin}/signin?error=no_code`);
}
