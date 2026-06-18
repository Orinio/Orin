/**
 * Organization Scoping Middleware
 * 
 * Provides utilities for routes to scope data by organization.
 * When a user is in an org context, queries can automatically filter by org_id.
 */
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

/**
 * Resolves the user's current org context from the request.
 * Sets req.orgId and req.orgRole if the user has an active org.
 * Falls back to personal context if no org is set.
 */
export async function resolveOrgContext(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      return next();
    }

    // Get user profile with current_org_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, current_org_id')
      .eq('auth_user_id', authUserId)
      .single();

    if (!userProfile?.current_org_id) {
      return next();
    }

    const orgId = userProfile.current_org_id;

    // Verify membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('role, status')
      .eq('org_id', orgId)
      .eq('user_id', userProfile.id)
      .single();

    if (membership?.status === 'active') {
      req.orgId = orgId;
      req.orgRole = membership.role;
      req.internalUserId = userProfile.id;
    }

    next();
  } catch (err) {
    logger.debug({ err }, 'Org context resolution failed — falling back to personal');
    next();
  }
}

/**
 * Helper to get the effective user ID for data queries.
 * If org context is set, returns the org_id for org-scoped queries.
 * Otherwise, returns the internal user ID for personal queries.
 */
export function getQueryScope(req: Request): { userId: string; orgId: string | null } {
  return {
    userId: req.internalUserId || '',
    orgId: req.orgId || null,
  };
}

/**
 * Helper to apply org-scoping to a Supabase query.
 * If orgId is present, adds .eq('org_id', orgId).
 * Otherwise, adds .eq('user_id', userId) for personal scoping.
 */
export function applyScope(
  query: any,
  scope: { userId: string; orgId: string | null }
): any {
  if (scope.orgId) {
    return query.eq('org_id', scope.orgId);
  }
  return query.eq('user_id', scope.userId);
}
