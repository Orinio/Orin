import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminCredentials,
  createSession,
  getSessionCookieName,
  getSessionMaxAge,
} from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    if (!verifyAdminCredentials(username, password)) {
      // Delay response to slow brute-force attacks
      await new Promise((r) => setTimeout(r, 1500));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = createSession(username);

    const response = NextResponse.json({ success: true, username });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: getSessionMaxAge(),
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
