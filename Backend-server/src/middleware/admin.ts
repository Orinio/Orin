/**
 * Admin Authorization Middleware
 * Requires authenticated user with admin role
 */
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware (req.user must be set)
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = (req as any).user;

  if (!user?.id) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  try {
    // Check user role in the users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('role, account_status')
      .eq('auth_user_id', user.id)
      .single();

    if (error || !userProfile) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'User profile not found',
        },
      });
      return;
    }

    if (userProfile.account_status !== 'active') {
      res.status(403).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is not active',
        },
      });
      return;
    }

    if (userProfile.role !== 'admin') {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      return;
    }

    // Attach role info to request
    (req as any).userRole = userProfile.role;
    next();
  } catch (err) {
    logger.error({ err }, 'Admin middleware error');
    res.status(500).json({
      error: {
        code: 'AUTH_FAILED',
        message: 'Authorization check failed',
      },
    });
  }
}

/**
 * Middleware to check if user has one of the specified roles
 * Must be used AFTER authMiddleware
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;

    if (!user?.id) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('role, account_status')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !userProfile) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'User profile not found',
          },
        });
        return;
      }

      if (userProfile.account_status !== 'active') {
        res.status(403).json({
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Account is not active',
          },
        });
        return;
      }

      if (!roles.includes(userProfile.role)) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Required role: ${roles.join(' or ')}`,
          },
        });
        return;
      }

      (req as any).userRole = userProfile.role;
      next();
    } catch (err) {
      logger.error({ err }, 'Role middleware error');
      res.status(500).json({
        error: {
          code: 'AUTH_FAILED',
          message: 'Authorization check failed',
        },
      });
    }
  };
}
