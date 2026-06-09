import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import type { Request, Response, NextFunction } from 'express';
import type { SubscriptionPlan } from '../lib/types.js';

// ============================================================
// Per-User Token Budget (daily rolling)
// ============================================================

interface TokenBudget {
  userId: string;
  tokensUsedToday: number;
  dailyLimit: number;
  lastReset: number;
}

const tokenBudgets = new Map<string, TokenBudget>();
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Tier-based daily token limits
export const TIER_TOKEN_LIMITS: Record<string, number> = {
  free: 100_000,
  pro: 500_000,
  team: 2_000_000,
};

function getTokenBudget(userId: string, tier: string = 'free'): TokenBudget {
  let budget = tokenBudgets.get(userId);
  const now = Date.now();
  if (!budget || now - budget.lastReset > RESET_INTERVAL_MS) {
    budget = {
      userId,
      tokensUsedToday: 0,
      dailyLimit: TIER_TOKEN_LIMITS[tier] || TIER_TOKEN_LIMITS.free,
      lastReset: now,
    };
    tokenBudgets.set(userId, budget);
  }
  return budget;
}

export function checkTokenBudget(userId: string, tier: string = 'free'): { allowed: boolean; remaining: number; limit: number } {
  const budget = getTokenBudget(userId, tier);
  const remaining = Math.max(0, budget.dailyLimit - budget.tokensUsedToday);
  return { allowed: remaining > 0, remaining, limit: budget.dailyLimit };
}

export function consumeTokens(userId: string, tokens: number, tier: string = 'free'): void {
  const budget = getTokenBudget(userId, tier);
  budget.tokensUsedToday += tokens;
}

// ============================================================
// Response Cache (in-memory, TTL-based)
// ============================================================

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached(key: string): any | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: any, ttlMs: number = CACHE_TTL_MS): void {
  responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) responseCache.delete(key);
  }
}

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now > entry.expiresAt) responseCache.delete(key);
  }
}, 5 * 60 * 1000);

// ============================================================
// Middleware: Per-User AI Rate Limit + Token Budget
// ============================================================

// Plan-based upgrade messages
const UPGRADE_MESSAGES: Record<string, string> = {
  free: 'Upgrade to Pro for 5x higher limits and priority access.',
  pro: 'Upgrade to Team for even higher limits and dedicated support.',
  team: 'Contact support for custom limits.',
};

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
};

export function userRateLimitMiddleware(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      next();
      return;
    }

    try {
      // Resolve internal user row (id + subscription plan)
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      const userId = userRow?.id || authUserId;
      (req as any).internalUserId = userId;

      // Fetch user's active subscription plan
      let plan: SubscriptionPlan = 'free';
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub?.plan) {
        plan = sub.plan as SubscriptionPlan;
      }

      // Check Supabase-based rate limit (plan-aware)
      const rateLimit = await import('../lib/rate-limit.js');
      const rateResult = await rateLimit.checkAIRateLimit(supabase, userId, endpoint, plan);

      if (!rateResult.allowed) {
        const waitMs = rateResult.nextAllowedAt
          ? Math.max(0, rateResult.nextAllowedAt.getTime() - Date.now())
          : 0;
        const waitMinutes = Math.ceil(waitMs / 60000);
        const waitSeconds = Math.ceil(waitMs / 1000);
        const waitDisplay = waitMinutes > 60
          ? `${Math.ceil(waitMinutes / 60)} hour${Math.ceil(waitMinutes / 60) > 1 ? 's' : ''}`
          : waitMinutes > 1
            ? `${waitMinutes} minutes`
            : `${waitSeconds} seconds`;

        const usage = rateResult.usage;
        const usageDisplay = usage ? `${usage.used}/${usage.limit}` : 'unknown';

        logger.warn({ userId, endpoint, plan, usage: usageDisplay, waitMs }, 'Per-user rate limit denied');

        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: rateResult.reason || 'Rate limit exceeded',
            details: {
              plan,
              planName: PLAN_NAMES[plan] || 'Free',
              usage: usage ? {
                used: usage.used,
                limit: usage.limit,
                remaining: Math.max(0, usage.limit - usage.used),
                resetsAt: usage.resetsAt?.toISOString(),
              } : null,
              retryAfterMs: waitMs,
              retryAfterDisplay: waitDisplay,
              nextAllowedAt: rateResult.nextAllowedAt?.toISOString(),
              upgradeMessage: plan !== 'team' ? UPGRADE_MESSAGES[plan] : undefined,
              upgradeUrl: plan === 'free' ? '/settings?tab=billing' : undefined,
            },
          },
        });
        return;
      }

      // Check token budget
      const tier = plan; // Use actual subscription plan
      const budget = checkTokenBudget(authUserId, tier);
      if (!budget.allowed) {
        logger.warn({ userId: authUserId, tier, remaining: budget.remaining, limit: budget.limit }, 'Token budget exceeded');
        res.status(429).json({
          error: {
            code: 'TOKEN_BUDGET_EXCEEDED',
            message: `Daily token budget of ${budget.limit.toLocaleString()} exceeded.`,
            details: {
              plan,
              planName: PLAN_NAMES[plan] || 'Free',
              tokenBudget: {
                used: budget.limit - budget.remaining,
                limit: budget.limit,
                remaining: 0,
              },
              retryAfterMs: RESET_INTERVAL_MS,
              retryAfterDisplay: '24 hours (resets daily)',
              upgradeMessage: plan !== 'team' ? UPGRADE_MESSAGES[plan] : undefined,
              upgradeUrl: plan === 'free' ? '/settings?tab=billing' : undefined,
            },
          },
        });
        return;
      }

      // Store for token consumption later
      (req as any).tokenBudget = budget;
      (req as any).userPlan = plan;

      // Capture response to log usage ONLY on success (2xx)
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let responseStatusCode = 200;

      res.status = function (code: number) {
        responseStatusCode = code;
        return originalStatus(code);
      };

      res.json = function (body: any) {
        // Only count successful responses toward rate limit
        if (responseStatusCode >= 200 && responseStatusCode < 300) {
          const tokensUsed = (body as any)?.tokensUsed || 0;
          if (tokensUsed > 0) {
            consumeTokens(authUserId, tokensUsed, tier);
          }
          rateLimit.logAIUsage(supabase, userId, endpoint, tokensUsed).catch(() => {});
        } else {
          logger.debug({ userId, endpoint, status: responseStatusCode }, 'Skipping rate limit count — error response');
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error({ error }, 'Rate limit middleware error — allowing request');
      next();
    }
  };
}