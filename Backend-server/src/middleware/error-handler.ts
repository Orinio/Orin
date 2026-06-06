import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/app-error.js';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Structured AppError — return code + message
  if (err instanceof AppError) {
    logger.warn(
      { code: err.code, message: err.message, requestId: req.id },
      'Application error',
    );
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  const httpErr = err as HttpError;

  // JWT / auth errors from Supabase
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
    return;
  }

  // CORS errors
  if (err.message?.includes('not allowed by CORS')) {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Origin not allowed by CORS policy' },
    });
    return;
  }

  // Body parser errors
  if (httpErr.type === 'entity.parse.failed') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON in request body' },
    });
    return;
  }

  if (httpErr.type === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'VALIDATION_ERROR', message: 'Request body too large' },
    });
    return;
  }

  // Everything else — 500 (log body for debugging, but redact sensitive fields)
  const sanitizedBody = req.body ? { ...req.body } : undefined;
  if (sanitizedBody) {
    // Redact potentially sensitive fields
    for (const key of Object.keys(sanitizedBody)) {
      if (/password|secret|token|key/i.test(key)) {
        sanitizedBody[key] = '[REDACTED]';
      }
    }
  }

  logger.error({
    err,
    requestId: req.id,
    method: req.method,
    url: req.url,
    body: sanitizedBody,
    userId: (req as any).user?.id,
  }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
}
