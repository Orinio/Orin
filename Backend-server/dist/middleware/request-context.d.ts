import type { Request, Response, NextFunction } from 'express';
/**
 * Middleware that sets up AsyncLocalStorage request context.
 * Must run after requestIdMiddleware and authMiddleware.
 */
export declare function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=request-context.d.ts.map