import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requestTiming } from '../src/middleware/request-timing.js';

describe('requestTiming middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { url: '/ai/chat', id: 'test-123' };
    res = {
      statusCode: 200,
      on: vi.fn(),
    };
    next = vi.fn();
  });

  it('should call next immediately', () => {
    requestTiming(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should skip health check URLs', () => {
    req.url = '/health';
    requestTiming(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
    // Should not register finish listener
    expect(res.on).not.toHaveBeenCalled();
  });

  it('should register finish listener for non-health URLs', () => {
    requestTiming(req as Request, res as Response, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});
