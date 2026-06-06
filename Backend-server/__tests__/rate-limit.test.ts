import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkGlobalAIRateLimit,
  getGlobalAIRateInfo,
  globalAIRateLimitMiddleware,
} from '../src/lib/rate-limit.js';

describe('Global AI Rate Limiter', () => {
  beforeEach(() => {
    // Clear the timestamps array by exhausting the window
    // We can't directly clear it, so we test behavior within a window
  });

  it('should allow requests under the limit', () => {
    const result = checkGlobalAIRateLimit();
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it('should return rate info', () => {
    const info = getGlobalAIRateInfo();
    expect(info.limit).toBeGreaterThan(0);
    expect(info.current).toBeGreaterThanOrEqual(0);
    expect(info.windowMs).toBe(60000);
  });

  it('should set correct headers on middleware when allowed', () => {
    const req = {} as any;
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    globalAIRateLimitMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
  });

  it('should deny when limit exceeded and set Retry-After', () => {
    // Exhaust the limit
    const originalLimit = parseInt(process.env.GLOBAL_AI_RPM_LIMIT || '35', 10);
    for (let i = 0; i < originalLimit + 1; i++) {
      checkGlobalAIRateLimit();
    }

    const result = checkGlobalAIRateLimit();
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
