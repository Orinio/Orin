/**
 * Admin Authorization Middleware
 * Requires authenticated user with admin role
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware (req.user must be set)
 */
export declare function adminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware to check if user has one of the specified roles
 * Must be used AFTER authMiddleware
 */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=admin.d.ts.map