import 'express';
import type { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: User;
      /** Resolved internal user ID (from users table, not auth user ID) */
      internalUserId?: string;
      /** Request start time for timing middleware */
      startTime?: number;
      /** Raw body for webhook signature verification */
      rawBody?: string;
      /** User platform role for admin middleware */
      userRole?: string;
      /** User subscription plan for rate limiting */
      userPlan?: string;
      /** Token budget info for rate limiting */
      tokenBudget?: { allowed: boolean; remaining: number; limit: number };
      /** Current organization ID (from route params or user context) */
      orgId?: string;
      /** User's role within the current organization */
      orgRole?: string;
    }
  }
}
