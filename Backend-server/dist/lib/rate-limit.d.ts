import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoachNoteType } from './types.js';
export declare function checkGlobalAIRateLimit(): {
    allowed: boolean;
    retryAfterMs: number;
};
export declare function getGlobalAIRateInfo(): {
    current: number;
    limit: number;
    windowMs: number;
};
export type { CoachNoteType };
export interface RateLimitConfig {
    maxPerDay: number;
    maxPerWeek: number;
    cooldownHours: number;
}
export declare const AI_RATE_LIMITS: Record<string, RateLimitConfig>;
export declare const RATE_LIMITS: Record<CoachNoteType, RateLimitConfig>;
export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    nextAllowedAt?: Date;
}
export declare function checkRateLimit(supabase: SupabaseClient, userId: string, noteType: CoachNoteType): Promise<RateLimitResult>;
export declare function getLastNoteCreatedAt(supabase: SupabaseClient, userId: string, noteType: CoachNoteType): Promise<Date | null>;
export declare function getNoteCount(supabase: SupabaseClient, userId: string, noteType: CoachNoteType, since: Date): Promise<number>;
export declare function logAIUsage(supabase: SupabaseClient, userId: string, endpoint: string, tokensUsed?: number): Promise<void>;
export declare function checkAIRateLimit(supabase: SupabaseClient, userId: string, endpoint: string): Promise<RateLimitResult>;
import type { Request, Response, NextFunction } from 'express';
export declare function globalAIRateLimitMiddleware(_req: Request, res: Response, next: NextFunction): void;
declare const AUTH_RATE_LIMITS: {
    signin: {
        maxAttempts: number;
        windowMs: number;
        blockDurationMs: number;
    };
    signup: {
        maxAttempts: number;
        windowMs: number;
        blockDurationMs: number;
    };
    resetPassword: {
        maxAttempts: number;
        windowMs: number;
        blockDurationMs: number;
    };
};
export declare function authRateLimitMiddleware(action: keyof typeof AUTH_RATE_LIMITS): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rate-limit.d.ts.map