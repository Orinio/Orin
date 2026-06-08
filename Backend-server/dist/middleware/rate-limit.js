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
function userRateLimitMiddleware(endpoint) {
    return async (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) {
            next();
            return;
        }
        try {
            // Check Supabase-based rate limit
            const rateLimit = await import('../lib/rate-limit.js');
            const rateResult = await rateLimit.checkAIRateLimit(supabase_js_1.supabase, userId, endpoint);
            if (!rateResult.allowed) {
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
            const tier = req.user?.tier || 'free';
            const budget = checkTokenBudget(userId, tier);
            if (!budget.allowed) {
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
            req.tokenBudget = budget;
            // Capture response to log usage
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                const tokensUsed = body?.tokensUsed || 0;
                if (tokensUsed > 0) {
                    consumeTokens(userId, tokensUsed, tier);
                }
                rateLimit.logAIUsage(supabase_js_1.supabase, userId, endpoint, tokensUsed).catch(() => { });
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