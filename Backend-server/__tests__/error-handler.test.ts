import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../src/middleware/error-handler.js';
import { AppError, Errors } from '../src/lib/app-error.js';

describe('errorHandler middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    req = { id: 'test-req-1' };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should handle AppError with correct status and code', () => {
    const err = Errors.notFound('User');
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  });

  it('should handle validation errors (400)', () => {
    const err = Errors.validation('Invalid email');
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email' },
    });
  });

  it('should handle rate limit errors (429)', () => {
    const err = Errors.rateLimited('Too many requests');
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
    const jsonCall = (res.json as any).mock.calls[0][0];
    expect(jsonCall.error.code).toBe('RATE_LIMITED');
    expect(jsonCall.error.message).toBe('Too many requests');
  });

  it('should handle JsonWebTokenError as 401', () => {
    const err = new Error('invalid token');
    err.name = 'JsonWebTokenError';
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  });

  it('should handle TokenExpiredError as 401', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle CORS errors as 403', () => {
    const err = new Error('Origin https://evil.com not allowed by CORS');
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'FORBIDDEN', message: 'Origin not allowed by CORS policy' },
    });
  });

  it('should handle unknown errors as 500', () => {
    const err = new Error('something broke');
    errorHandler(err, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  });
});
