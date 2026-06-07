import type { Request, Response, NextFunction } from 'express';
/**
 * Request timing middleware — logs method, URL, status, and duration.
 * Skips health checks to avoid noise. Uses info level for errors, debug for success.
 */
export declare function requestTiming(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=request-timing.d.ts.map