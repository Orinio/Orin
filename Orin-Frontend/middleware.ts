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

  // IMPORTANT: Use getUser() which validates the JWT against Supabase
  // getSession() only reads local cookies without validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auth routes - let them through, handle redirects client-side
  const authPaths = ['/signin', '/signup', '/reset-password', '/update-password', '/auth/callback'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If user is on auth page and is logged in, redirect to dashboard
  if (isAuthPath && user) {
    // Don't redirect if already going to dashboard (prevent loop)
    if (!request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/opportunities',
    '/settings',
    '/notifications',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !user) {
    // Don't redirect if already going to signin (prevent loop)
    if (request.nextUrl.pathname !== '/signin') {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // API routes that require authentication
  const protectedApiPaths = [
    '/api/ai/',
    '/api/coach-notes/',
    '/api/proofs/',
    '/api/user/',
  ];

  const isProtectedApiPath = protectedApiPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedApiPath && !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Admin-only routes (legacy Supabase-based)
  const adminPaths = ['/admin', '/api/admin/'];
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

  // Admin-dev routes — protected by standalone admin auth (cookie-based)
  const adminDevPaths = ['/admin-dev'];
  const adminDevApiPaths = ['/api/admin-dev/'];
  const isAdminDevPath = adminDevPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isAdminDevApiPath = adminDevApiPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Protect admin-dev pages (except the login page which the layout handles)
  if (isAdminDevPath && request.nextUrl.pathname !== '/admin-dev' && request.nextUrl.pathname !== '/admin-dev/login') {
    // The layout handles auth checks client-side; middleware just ensures the route exists
  }

  // Protect admin-dev API routes (except auth endpoints)
  if (isAdminDevApiPath && !request.nextUrl.pathname.startsWith('/api/admin-dev/auth')) {
    // API auth is validated inside each route handler using the session cookie
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
