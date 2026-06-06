import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requestDeduplication, _clearDeduplicationCache } from '../src/middleware/request-deduplication.js';

describe('requestDeduplication middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.useFakeTimers();
    _clearDeduplicationCache();
    req = { method: 'POST', url: '/ai/chat', body: { message: 'hello' }, id: 'test-1' };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow the first request', () => {
    requestDeduplication(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should reject duplicate POST within 5s window', () => {
    requestDeduplication(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    const next2 = vi.fn();
    requestDeduplication(req as Request, res as Response, next2);
    expect(next2).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should allow GET requests without dedup', () => {
    req.method = 'GET';
    requestDeduplication(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should skip webhooks', () => {
    req.url = '/webhooks/stripe';
    requestDeduplication(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should allow different body after dedup window', () => {
    requestDeduplication(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Advance past dedup window
    vi.advanceTimersByTime(6000);

    const next2 = vi.fn();
    requestDeduplication(req as Request, res as Response, next2);
    expect(next2).toHaveBeenCalledOnce();
  });

  it('should treat different bodies as separate requests', () => {
    requestDeduplication(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    const req2 = { ...req, body: { message: 'different' }, id: 'test-2' };
    const next2 = vi.fn();
    requestDeduplication(req2 as Request, res as Response, next2);
    expect(next2).toHaveBeenCalledOnce();
  });
});
