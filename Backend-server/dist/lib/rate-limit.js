"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS = exports.AI_RATE_LIMITS = void 0;
exports.checkGlobalAIRateLimit = checkGlobalAIRateLimit;
exports.getGlobalAIRateInfo = getGlobalAIRateInfo;
exports.checkRateLimit = checkRateLimit;
exports.getLastNoteCreatedAt = getLastNoteCreatedAt;
exports.getNoteCount = getNoteCount;
exports.logAIUsage = logAIUsage;
exports.checkAIRateLimit = checkAIRateLimit;
exports.globalAIRateLimitMiddleware = globalAIRateLimitMiddleware;
exports.authRateLimitMiddleware = authRateLimitMiddleware;
const logger_js_1 = require("./logger.js");
// ============================================================
// Global AI Rate Limiter (sliding window, in-memory)
// Protects the NVIDIA NIM API quota (40 RPM free tier)
// ============================================================
const GLOBAL_AI_RPM_LIMIT = parseInt(process.env.GLOBAL_AI_RPM_LIMIT || '35', 10);
const WINDOW_SIZE_MS = 60_000; // 1 minute
const globalAiTimestamps = [];
function checkGlobalAIRateLimit() {
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_MS;
    // Remove timestamps outside the window
    while (globalAiTimestamps.length > 0 && globalAiTimestamps[0] <= windowStart) {
        globalAiTimestamps.shift();
    }
    if (globalAiTimestamps.length >= GLOBAL_AI_RPM_LIMIT) {
        const oldestInWindow = globalAiTimestamps[0];
        const retryAfterMs = oldestInWindow + WINDOW_SIZE_MS - now;
        return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
    }
    globalAiTimestamps.push(now);
    return { allowed: true, retryAfterMs: 0 };
}
function getGlobalAIRateInfo() {
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_MS;
    while (globalAiTimestamps.length > 0 && globalAiTimestamps[0] <= windowStart) {
        globalAiTimestamps.shift();
    }
    return { current: globalAiTimestamps.length, limit: GLOBAL_AI_RPM_LIMIT, windowMs: WINDOW_SIZE_MS };
}
// General AI endpoint rate limits
exports.AI_RATE_LIMITS = {
    'ai-verify': {
        maxPerDay: 10,
        maxPerWeek: 50,
        cooldownHours: 0.5,
    },
    'ai-chat': {
        maxPerDay: 30,
        maxPerWeek: 150,
        cooldownHours: 0.1,
    },
    'ai-match-opportunities': {
        maxPerDay: 5,
        maxPerWeek: 20,
        cooldownHours: 1,
    },
    'ai-skills': {
        maxPerDay: 10,
        maxPerWeek: 50,
        cooldownHours: 0.5,
    },
    'coach-notes-generate': {
        maxPerDay: 3,
        maxPerWeek: 10,
        cooldownHours: 4,
    },
};
exports.RATE_LIMITS = {
    daily: {
        maxPerDay: 1,
        maxPerWeek: 7,
        cooldownHours: 6,
    },
    weekly: {
        maxPerDay: 0,
        maxPerWeek: 1,
        cooldownHours: 168,
    },
    milestone: {
        maxPerDay: 3,
        maxPerWeek: 10,
        cooldownHours: 1,
    },
    ad_hoc: {
        maxPerDay: 2,
        maxPerWeek: 14,
        cooldownHours: 4,
    },
};
async function checkRateLimit(supabase, userId, noteType) {
    const config = exports.RATE_LIMITS[noteType];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: recentNotes, error } = await supabase
        .from('coach_notes')
        .select('created_at, type')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
    if (error) {
        logger_js_1.logger.error({ error }, 'Rate limit check failed — denying request (fail-closed)');
        return { allowed: false, reason: 'Rate limit check unavailable' };
    }
    const notesLast24h = (recentNotes || []).filter((n) => new Date(n.created_at) >= twentyFourHoursAgo);
    const notesLast7d = recentNotes || [];
    const typeNotesLast24h = notesLast24h.filter((n) => n.type === noteType);
    if (typeNotesLast24h.length >= config.maxPerDay) {
        const lastNote = typeNotesLast24h[0];
        const nextAllowed = new Date(lastNote.created_at);
        nextAllowed.setHours(nextAllowed.getHours() + config.cooldownHours);
        return {
            allowed: false,
            reason: `Daily limit reached for ${noteType} notes`,
            nextAllowedAt: nextAllowed,
        };
    }
    const typeNotesLast7d = notesLast7d.filter((n) => n.type === noteType);
    if (typeNotesLast7d.length >= config.maxPerWeek) {
        return {
            allowed: false,
            reason: `Weekly limit reached for ${noteType} notes`,
            nextAllowedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
    }
    if (typeNotesLast24h.length > 0) {
        const lastNote = typeNotesLast24h[0];
        const lastNoteTime = new Date(lastNote.created_at);
        const cooldownEnd = new Date(lastNoteTime.getTime() + config.cooldownHours * 60 * 60 * 1000);
        if (now < cooldownEnd) {
            return {
                allowed: false,
                reason: `Cooldown period active for ${noteType} notes`,
                nextAllowedAt: cooldownEnd,
            };
        }
    }
    return { allowed: true };
}
async function getLastNoteCreatedAt(supabase, userId, noteType) {
    const { data, error } = await supabase
        .from('coach_notes')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', noteType)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error || !data)
        return null;
    return new Date(data.created_at);
}
async function getNoteCount(supabase, userId, noteType, since) {
    const { count, error } = await supabase
        .from('coach_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', noteType)
        .is('deleted_at', null)
        .gte('created_at', since.toISOString());
    if (error)
        return 0;
    return count || 0;
}
// Log AI usage to the ai_usage_log table
async function logAIUsage(supabase, userId, endpoint, tokensUsed = 0) {
    const { error } = await supabase
        .from('ai_usage_log')
        .insert({
        user_id: userId,
        endpoint,
        tokens_used: tokensUsed,
    });
    if (error) {
        logger_js_1.logger.error({ error }, 'Failed to log AI usage');
    }
}
// General-purpose rate limiter for AI endpoints using ai_usage_log
async function checkAIRateLimit(supabase, userId, endpoint) {
    const config = exports.AI_RATE_LIMITS[endpoint] || {
        maxPerDay: 20,
        maxPerWeek: 100,
        cooldownHours: 0.5,
    };
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Query ai_usage_log for this user's recent activity
    const { data: recentUsage, error } = await supabase
        .from('ai_usage_log')
        .select('created_at')
        .eq('user_id', userId)
        .eq('endpoint', endpoint)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
    if (error) {
        // Fail closed: deny if we can't check rate limits
        logger_js_1.logger.error({ error }, 'AI rate limit check failed — denying request (fail-closed)');
        return { allowed: false, reason: 'Rate limit check unavailable' };
    }
    const usageLast24h = (recentUsage || []).filter((u) => new Date(u.created_at) >= twentyFourHoursAgo);
    const usageLast7d = recentUsage || [];
    // Check daily limit
    if (usageLast24h.length >= config.maxPerDay) {
        const lastUsage = usageLast24h[0];
        const nextAllowed = new Date(lastUsage.created_at);
        nextAllowed.setHours(nextAllowed.getHours() + config.cooldownHours);
        return {
            allowed: false,
            reason: `Daily limit reached for ${endpoint}`,
            nextAllowedAt: nextAllowed,
        };
    }
    // Check weekly limit
    if (usageLast7d.length >= config.maxPerWeek) {
        return {
            allowed: false,
            reason: `Weekly limit reached for ${endpoint}`,
            nextAllowedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
    }
    // Check cooldown period
    if (usageLast24h.length > 0) {
        const lastUsage = usageLast24h[0];
        const lastUsageTime = new Date(lastUsage.created_at);
        const cooldownEnd = new Date(lastUsageTime.getTime() + config.cooldownHours * 60 * 60 * 1000);
        if (now < cooldownEnd) {
            return {
                allowed: false,
                reason: `Cooldown period active for ${endpoint}`,
                nextAllowedAt: cooldownEnd,
            };
        }
    }
    return { allowed: true };
}
function globalAIRateLimitMiddleware(_req, res, next) {
    const result = checkGlobalAIRateLimit();
    if (!result.allowed) {
        const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
        res.setHeader('Retry-After', retryAfterSec.toString());
        res.setHeader('X-RateLimit-Limit', GLOBAL_AI_RPM_LIMIT.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.status(429).json({
            error: {
                code: 'GLOBAL_RATE_LIMITED',
                message: `AI service rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
                retryAfterMs: result.retryAfterMs,
            },
        });
        return;
    }
    const info = getGlobalAIRateInfo();
    res.setHeader('X-RateLimit-Limit', info.limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, info.limit - info.current).toString());
    next();
}
const authRateLimitMap = new Map();
const AUTH_RATE_LIMITS = {
    signin: { maxAttempts: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 },
    signup: { maxAttempts: 5, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
    resetPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
};
function getAuthRateLimitKey(ip, action) {
    return `auth:${action}:${ip}`;
}
function checkAuthRateLimit(ip, action) {
    const config = AUTH_RATE_LIMITS[action];
    const key = getAuthRateLimitKey(ip, action);
    const now = Date.now();
    const entry = authRateLimitMap.get(key);
    if (!entry) {
        authRateLimitMap.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
        return { allowed: true, retryAfterMs: 0 };
    }
    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
        return { allowed: false, retryAfterMs: entry.blockedUntil - now };
    }
    // Reset if window has passed
    if (now - entry.firstAttempt > config.windowMs) {
        authRateLimitMap.set(key, { attempts: 1, firstAttempt: now, lastAttempt: now });
        return { allowed: true, retryAfterMs: 0 };
    }
    // Check rate limit
    entry.attempts++;
    entry.lastAttempt = now;
    if (entry.attempts > config.maxAttempts) {
        entry.blockedUntil = now + config.blockDurationMs;
        authRateLimitMap.set(key, entry);
        return { allowed: false, retryAfterMs: config.blockDurationMs };
    }
    authRateLimitMap.set(key, entry);
    return { allowed: true, retryAfterMs: 0 };
}
function authRateLimitMiddleware(action) {
    return (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const result = checkAuthRateLimit(ip, action);
        if (!result.allowed) {
            const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
            res.setHeader('Retry-After', retryAfterSec.toString());
            res.status(429).json({
                error: {
                    code: 'AUTH_RATE_LIMITED',
                    message: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.`,
                    retryAfterMs: result.retryAfterMs,
                },
            });
            return;
        }
        next();
    };
}
// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of authRateLimitMap.entries()) {
        if (entry.blockedUntil && now > entry.blockedUntil) {
            authRateLimitMap.delete(key);
        }
        else if (now - entry.firstAttempt > 60 * 60 * 1000) {
            authRateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);
//# sourceMappingURL=rate-limit.js.map