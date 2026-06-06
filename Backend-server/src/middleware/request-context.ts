import type { Request, Response, NextFunction } from 'express';
import { requestContext } from '../lib/request-context.js';

/**
 * Middleware that sets up AsyncLocalStorage request context.
 * Must run after requestIdMiddleware and authMiddleware.
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const ctx = {
    requestId: req.id,
    userId: (req as any).user?.id,
  };

  requestContext.run(ctx, () => {
    next();
  });
}
