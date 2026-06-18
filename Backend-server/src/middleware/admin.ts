/**
 * Admin Authorization Middleware
 * Requires authenticated user with admin role
 */
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import type { OrgRole } from '../lib/types.js';

/**
 * Middleware to check if user is an admin
 * Must be used AFTER authMiddleware (req.user must be set)
 */
export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user;

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
    req.userRole = userProfile.role;
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
 * Middleware to check if user has one of the specified platform roles
 * Must be used AFTER authMiddleware
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

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

      req.userRole = userProfile.role;
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

/**
 * Middleware to check if user has the required org role within a specific organization.
 * Reads org ID from req.params.orgId or req.body.orgId.
 * Must be used AFTER authMiddleware.
 */
export function requireOrgRole(...allowedRoles: OrgRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!user?.id) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const orgId = (req.params.orgId as string) || (req.body.orgId as string) || (req.query.orgId as string);

    if (!orgId) {
      res.status(400).json({
        error: { code: 'MISSING_ORG_ID', message: 'Organization ID is required' },
      });
      return;
    }

    try {
      // Resolve internal user ID
      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userProfile) {
        res.status(403).json({
          error: { code: 'FORBIDDEN', message: 'User profile not found' },
        });
        return;
      }

      // Check org membership and role
      const { data: membership, error } = await supabase
        .from('org_members')
        .select('role, status')
        .eq('org_id', orgId)
        .eq('user_id', userProfile.id)
        .single();

      if (error || !membership) {
        res.status(403).json({
          error: { code: 'NOT_ORG_MEMBER', message: 'You are not a member of this organization' },
        });
        return;
      }

      if (membership.status !== 'active') {
        res.status(403).json({
          error: { code: 'ORG_MEMBERSHIP_INACTIVE', message: 'Your organization membership is not active' },
        });
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_ORG_ROLE',
            message: `Required organization role: ${allowedRoles.join(' or ')}`,
          },
        });
        return;
      }

      // Attach org context to request
      req.orgId = orgId;
      req.orgRole = membership.role;
      req.internalUserId = userProfile.id;
      next();
    } catch (err) {
      logger.error({ err }, 'Org role middleware error');
      res.status(500).json({
        error: { code: 'AUTH_FAILED', message: 'Authorization check failed' },
      });
    }
  };
}
