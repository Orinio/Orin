"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_TOKEN_LIMITS = void 0;
exports.checkTokenBudget = checkTokenBudget;
exports.consumeTokens = consumeTokens;
exports.getCached = getCached;
exports.setCache = setCache;
exports.clearCache = clearCache;
exports.userRateLimitMiddleware = userRateLimitMiddleware;
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
const tokenBudgets = new Map();
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
// Tier-based daily token limits
exports.TIER_TOKEN_LIMITS = {
    free: 100_000,
    pro: 500_000,
    team: 2_000_000,
};
function getTokenBudget(userId, tier = 'free') {
    let budget = tokenBudgets.get(userId);
    const now = Date.now();
    if (!budget || now - budget.lastReset > RESET_INTERVAL_MS) {
        budget = {
            userId,
            tokensUsedToday: 0,
            dailyLimit: exports.TIER_TOKEN_LIMITS[tier] || exports.TIER_TOKEN_LIMITS.free,
            lastReset: now,
        };
        tokenBudgets.set(userId, budget);
    }
    return budget;
}
function checkTokenBudget(userId, tier = 'free') {
    const budget = getTokenBudget(userId, tier);
    const remaining = Math.max(0, budget.dailyLimit - budget.tokensUsedToday);
    return { allowed: remaining > 0, remaining, limit: budget.dailyLimit };
}
function consumeTokens(userId, tokens, tier = 'free') {
    const budget = getTokenBudget(userId, tier);
    budget.tokensUsedToday += tokens;
}
const responseCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
function getCached(key) {
    const entry = responseCache.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        responseCache.delete(key);
        return null;
    }
    return entry.data;
}
function setCache(key, data, ttlMs = CACHE_TTL_MS) {
    responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
function clearCache(pattern) {
    if (!pattern) {
        responseCache.clear();
        return;
    }
    for (const key of responseCache.keys()) {
        if (key.includes(pattern))
            responseCache.delete(key);
    }
}
// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of responseCache.entries()) {
        if (now > entry.expiresAt)
            responseCache.delete(key);
    }
}, 5 * 60 * 1000);
// ============================================================
// Middleware: Per-User AI Rate Limit + Token Budget
// ============================================================
// Plan-based upgrade messages
const UPGRADE_MESSAGES = {
    free: 'Upgrade to Pro for 5x higher limits and priority access.',
    pro: 'Upgrade to Team for even higher limits and dedicated support.',
    team: 'Contact support for custom limits.',
};
const PLAN_NAMES = {
    free: 'Free',
    pro: 'Pro',
    team: 'Team',
};
function userRateLimitMiddleware(endpoint) {
    return async (req, res, next) => {
        const authUserId = req.user?.id;
        if (!authUserId) {
            next();
            return;
        }
        try {
            // Resolve internal user row (id + subscription plan)
            const { data: userRow } = await supabase_js_1.supabase
                .from('users')
                .select('id')
                .eq('auth_user_id', authUserId)
                .maybeSingle();
            const userId = userRow?.id || authUserId;
            req.internalUserId = userId;
            // Fetch user's active subscription plan
            let plan = 'free';
            const { data: sub } = await supabase_js_1.supabase
                .from('subscriptions')
                .select('plan, status')
                .eq('user_id', userId)
                .in('status', ['active', 'trialing'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (sub?.plan) {
                plan = sub.plan;
            }
            // Check Supabase-based rate limit (plan-aware)
            const rateLimit = await import('../lib/rate-limit.js');
            const rateResult = await rateLimit.checkAIRateLimit(supabase_js_1.supabase, userId, endpoint, plan);
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
                logger_js_1.logger.warn({ userId, endpoint, plan, usage: usageDisplay, waitMs }, 'Per-user rate limit denied');
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
                logger_js_1.logger.warn({ userId: authUserId, tier, remaining: budget.remaining, limit: budget.limit }, 'Token budget exceeded');
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
            req.tokenBudget = budget;
            req.userPlan = plan;
            // Capture response to log usage ONLY on success (2xx)
            const originalJson = res.json.bind(res);
            const originalStatus = res.status.bind(res);
            let responseStatusCode = 200;
            res.status = function (code) {
                responseStatusCode = code;
                return originalStatus(code);
            };
            res.json = function (body) {
                // Only count successful responses toward rate limit
                if (responseStatusCode >= 200 && responseStatusCode < 300) {
                    const tokensUsed = body?.tokensUsed || 0;
                    if (tokensUsed > 0) {
                        consumeTokens(authUserId, tokensUsed, tier);
                    }
                    rateLimit.logAIUsage(supabase_js_1.supabase, userId, endpoint, tokensUsed).catch(() => { });
                }
                else {
                    logger_js_1.logger.debug({ userId, endpoint, status: responseStatusCode }, 'Skipping rate limit count — error response');
                }
                return originalJson(body);
            };
            next();
        }
        catch (error) {
            logger_js_1.logger.error({ error }, 'Rate limit middleware error — allowing request');
            next();
        }
    };
}
//# sourceMappingURL=rate-limit.js.map