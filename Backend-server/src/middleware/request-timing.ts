import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Request timing middleware — logs method, URL, status, and duration.
 * Skips health checks to avoid noise. Uses info level for errors, debug for success.
 */
export function requestTiming(req: Request, res: Response, next: NextFunction): void {
  // Skip health checks
  if (req.url === '/health' || req.url === '/health/') {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = (durationNs / 1_000_000).toFixed(1);

    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      durationMs: parseFloat(durationMs),
      requestId: req.id,
      userId: (req as any).user?.id,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request completed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed');
    } else {
      logger.debug(logData, 'Request completed');
    }
  });

  next();
}
