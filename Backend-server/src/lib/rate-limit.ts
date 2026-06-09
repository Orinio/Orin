import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoachNoteType } from './types.js';
import { logger } from './logger.js';

// ============================================================
// Global AI Rate Limiter (sliding window, in-memory)
// Protects the NVIDIA NIM API quota (40 RPM free tier)
// ============================================================

const GLOBAL_AI_RPM_LIMIT = parseInt(process.env.GLOBAL_AI_RPM_LIMIT || '35', 10);
const WINDOW_SIZE_MS = 60_000; // 1 minute

const globalAiTimestamps: number[] = [];

export function checkGlobalAIRateLimit(): { allowed: boolean; retryAfterMs: number } {
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

export function getGlobalAIRateInfo(): { current: number; limit: number; windowMs: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE_MS;
  while (globalAiTimestamps.length > 0 && globalAiTimestamps[0] <= windowStart) {
    globalAiTimestamps.shift();
  }
  return { current: globalAiTimestamps.length, limit: GLOBAL_AI_RPM_LIMIT, windowMs: WINDOW_SIZE_MS };
}

export type { CoachNoteType };

export interface RateLimitConfig {
  maxPerDay: number;
  maxPerWeek: number;
  cooldownHours: number;
}

// Plan-aware AI endpoint rate limits
// Free gets basic limits, Pro gets 5x, Team gets 20x
export const AI_RATE_LIMITS_BY_PLAN: Record<string, Record<string, RateLimitConfig>> = {
  free: {
    'ai-verify': { maxPerDay: 10, maxPerWeek: 50, cooldownHours: 0.5 },
    'ai-chat': { maxPerDay: 15, maxPerWeek: 75, cooldownHours: 0.0167 },
    'ai-chat-stream': { maxPerDay: 15, maxPerWeek: 75, cooldownHours: 0.0167 },
    'ai-match-opportunities': { maxPerDay: 5, maxPerWeek: 20, cooldownHours: 1 },
    'ai-skills': { maxPerDay: 10, maxPerWeek: 50, cooldownHours: 0.5 },
    'coach-notes-generate': { maxPerDay: 3, maxPerWeek: 10, cooldownHours: 4 },
    _default: { maxPerDay: 10, maxPerWeek: 50, cooldownHours: 0.5 },
  },
  pro: {
    'ai-verify': { maxPerDay: 50, maxPerWeek: 250, cooldownHours: 0.1 },
    'ai-chat': { maxPerDay: 100, maxPerWeek: 500, cooldownHours: 0.00139 },
    'ai-chat-stream': { maxPerDay: 100, maxPerWeek: 500, cooldownHours: 0.00139 },
    'ai-match-opportunities': { maxPerDay: 25, maxPerWeek: 100, cooldownHours: 0.25 },
    'ai-skills': { maxPerDay: 50, maxPerWeek: 250, cooldownHours: 0.1 },
    'coach-notes-generate': { maxPerDay: 15, maxPerWeek: 50, cooldownHours: 1 },
    _default: { maxPerDay: 50, maxPerWeek: 250, cooldownHours: 0.1 },
  },
  team: {
    'ai-verify': { maxPerDay: 200, maxPerWeek: 1000, cooldownHours: 0.025 },
    'ai-chat': { maxPerDay: 300, maxPerWeek: 1500, cooldownHours: 0.00056 },
    'ai-chat-stream': { maxPerDay: 300, maxPerWeek: 1500, cooldownHours: 0.00056 },
    'ai-match-opportunities': { maxPerDay: 100, maxPerWeek: 400, cooldownHours: 0.1 },
    'ai-skills': { maxPerDay: 200, maxPerWeek: 1000, cooldownHours: 0.025 },
    'coach-notes-generate': { maxPerDay: 50, maxPerWeek: 200, cooldownHours: 0.5 },
    _default: { maxPerDay: 200, maxPerWeek: 1000, cooldownHours: 0.025 },
  },
};

// Legacy export for backwards compatibility
export const AI_RATE_LIMITS = AI_RATE_LIMITS_BY_PLAN.free;

export function getRateLimitConfigForPlan(endpoint: string, plan: string = 'free'): RateLimitConfig {
  const planLimits = AI_RATE_LIMITS_BY_PLAN[plan] || AI_RATE_LIMITS_BY_PLAN.free;
  return planLimits[endpoint] || planLimits._default;
}

export const RATE_LIMITS: Record<CoachNoteType, RateLimitConfig> = {
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

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  nextAllowedAt?: Date;
  usage?: {
    used: number;
    limit: number;
    resetsAt: Date;
  };
  plan?: string;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  noteType: CoachNoteType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[noteType];
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
    logger.error({ error }, 'Rate limit check failed — denying request (fail-closed)');
    return { allowed: false, reason: 'Rate limit check unavailable' };
  }

  const notesLast24h = (recentNotes || []).filter(
    (n) => new Date(n.created_at) >= twentyFourHoursAgo
  );

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

export async function getLastNoteCreatedAt(
  supabase: SupabaseClient,
  userId: string,
  noteType: CoachNoteType
): Promise<Date | null> {
  const { data, error } = await supabase
    .from('coach_notes')
    .select('created_at')
    .eq('user_id', userId)
    .eq('type', noteType)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return new Date(data.created_at);
}

export async function getNoteCount(
  supabase: SupabaseClient,
  userId: string,
  noteType: CoachNoteType,
  since: Date
): Promise<number> {
  const { count, error } = await supabase
    .from('coach_notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', noteType)
    .is('deleted_at', null)
    .gte('created_at', since.toISOString());

  if (error) return 0;
  return count || 0;
}

// Log AI usage to the ai_usage_log table
export async function logAIUsage(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  tokensUsed: number = 0
): Promise<void> {
  const { error } = await supabase
    .from('ai_usage_log')
    .insert({
      user_id: userId,
      endpoint,
      tokens_used: tokensUsed,
    });

  if (error) {
    logger.error({ error }, 'Failed to log AI usage');
  }
}

// General-purpose rate limiter for AI endpoints using ai_usage_log
export async function checkAIRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  plan: string = 'free'
): Promise<RateLimitResult> {
  const config = getRateLimitConfigForPlan(endpoint, plan);

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
    logger.error({ error, userId, endpoint }, 'AI rate limit check failed — denying request (fail-closed)');
    return { allowed: false, reason: 'Rate limit check unavailable' };
  }

  const usageLast24h = (recentUsage || []).filter(
    (u) => new Date(u.created_at) >= twentyFourHoursAgo
  );

  const usageLast7d = recentUsage || [];

  logger.debug({ userId, endpoint, plan, usageLast24h: usageLast24h.length, usageLast7d: usageLast7d.length, maxPerDay: config.maxPerDay }, 'AI rate limit check');

  // Calculate when the daily window resets (24h from first usage in window)
  const dailyResetsAt = usageLast24h.length > 0
    ? new Date(new Date(usageLast24h[usageLast24h.length - 1].created_at).getTime() + 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Check daily limit
  if (usageLast24h.length >= config.maxPerDay) {
    const lastUsage = usageLast24h[0];
    const nextAllowed = new Date(lastUsage.created_at);
    nextAllowed.setHours(nextAllowed.getHours() + config.cooldownHours);
    return {
      allowed: false,
      reason: `Daily limit reached for ${endpoint}`,
      nextAllowedAt: nextAllowed,
      usage: { used: usageLast24h.length, limit: config.maxPerDay, resetsAt: dailyResetsAt },
      plan,
    };
  }

  // Check weekly limit
  if (usageLast7d.length >= config.maxPerWeek) {
    return {
      allowed: false,
      reason: `Weekly limit reached for ${endpoint}`,
      nextAllowedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      usage: { used: usageLast7d.length, limit: config.maxPerWeek, resetsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      plan,
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
        usage: { used: usageLast24h.length, limit: config.maxPerDay, resetsAt: dailyResetsAt },
        plan,
      };
    }
  }

  return {
    allowed: true,
    usage: { used: usageLast24h.length, limit: config.maxPerDay, resetsAt: dailyResetsAt },
    plan,
  };
}

// ============================================================
// Global AI Rate Limit Middleware
// ============================================================

import type { Request, Response, NextFunction } from 'express';

export function globalAIRateLimitMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const result = checkGlobalAIRateLimit();
  if (!result.allowed) {
    const retryAfterSec = Math.ceil(result.retryAfterMs / 1000);
    logger.warn({ retryAfterMs: result.retryAfterMs, current: getGlobalAIRateInfo().current, limit: GLOBAL_AI_RPM_LIMIT }, 'Global AI rate limit denied');
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

// ============================================================
// Auth Rate Limiter (in-memory, per IP)
// Protects auth endpoints from brute-force attacks
// ============================================================

interface AuthRateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const authRateLimitMap = new Map<string, AuthRateLimitEntry>();

const AUTH_RATE_LIMITS = {
  signin: { maxAttempts: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 },
  signup: { maxAttempts: 5, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
  resetPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000, blockDurationMs: 60 * 60 * 1000 },
};

function getAuthRateLimitKey(ip: string, action: string): string {
  return `auth:${action}:${ip}`;
}

function checkAuthRateLimit(ip: string, action: keyof typeof AUTH_RATE_LIMITS): { allowed: boolean; retryAfterMs: number } {
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

export function authRateLimitMiddleware(action: keyof typeof AUTH_RATE_LIMITS) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
    } else if (now - entry.firstAttempt > 60 * 60 * 1000) {
      authRateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
