/**
 * Orin Frontend - Verify Proxy Route
 * Proxies verification requests to the backend verify endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  if (!hash) {
    return NextResponse.json(
      { error: { code: 'MISSING_HASH', message: 'Hash is required' } },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/verify/${hash}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: { code: 'BACKEND_ERROR', message: 'Failed to reach verification service' } },
      { status: 502 }
    );
  }
}
