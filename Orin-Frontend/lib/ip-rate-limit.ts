import { NextRequest, NextResponse } from 'next/server';

interface IPRateEntry {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, IPRateEntry>();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipStore) {
    if (now >= entry.resetAt) {
      ipStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface IPRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const IP_RATE_LIMITS: Record<string, IPRateLimitConfig> = {
  'auth/signin': { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  'auth/signup': { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  'contact': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
};

export function checkIPRateLimit(
  req: NextRequest,
  endpoint: string
): NextResponse | null {
  const config = IP_RATE_LIMITS[endpoint];
  if (!config) return null;

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  let entry = ipStore.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs };
    ipStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
