import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import type { Request, Response, NextFunction } from 'express';

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

export function userRateLimitMiddleware(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      next();
      return;
    }

    try {
      // Resolve internal users.id from auth UUID (ai_usage_log FK requires users.id)
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      const userId = userRow?.id || authUserId;
      (req as any).internalUserId = userId;

      // Check Supabase-based rate limit
      const rateLimit = await import('../lib/rate-limit.js');

      const rateResult = await rateLimit.checkAIRateLimit(supabase, userId, endpoint);
      if (!rateResult.allowed) {
        logger.warn({ userId, endpoint, reason: rateResult.reason }, 'Per-user rate limit denied');
        res.status(429).json({
          error: {
            code: 'RATE_LIMITED',
            message: rateResult.reason,
            nextAllowedAt: rateResult.nextAllowedAt,
          },
        });
        return;
      }

      // Check token budget
      const tier = (req as any).user?.tier || 'free';
      const budget = checkTokenBudget(authUserId, tier);
      if (!budget.allowed) {
        logger.warn({ userId: authUserId, tier, remaining: budget.remaining, limit: budget.limit }, 'Token budget exceeded');
        res.status(429).json({
          error: {
            code: 'TOKEN_BUDGET_EXCEEDED',
            message: `Daily token budget of ${budget.limit.toLocaleString()} exceeded. Upgrade to increase your limit.`,
            remaining: budget.remaining,
            limit: budget.limit,
          },
        });
        return;
      }

      // Store for token consumption later
      (req as any).tokenBudget = budget;

      // Capture response to log usage
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        const tokensUsed = (body as any)?.tokensUsed || 0;
        if (tokensUsed > 0) {
          consumeTokens(authUserId, tokensUsed, tier);
        }
        rateLimit.logAIUsage(supabase, userId, endpoint, tokensUsed).catch(() => {});
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error({ error }, 'Rate limit middleware error — allowing request');
      next();
    }
  };
}