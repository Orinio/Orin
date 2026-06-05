import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/opportunities',
    '/api/ai/',
    '/api/coach-notes/',
    '/api/proofs/',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only routes
  const adminPaths = ['/api/admin/', '/admin'];

  const isAdminPath = adminPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAdminPath && user) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);
    const userEmail = user.email;

    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/opportunities/:path*',
    '/api/ai/:path*',
    '/api/coach-notes/:path*',
    '/api/proofs/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
