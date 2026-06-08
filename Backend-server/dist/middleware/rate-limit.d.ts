import type { Request, Response, NextFunction } from 'express';
export declare const TIER_TOKEN_LIMITS: Record<string, number>;
export declare function checkTokenBudget(userId: string, tier?: string): {
    allowed: boolean;
    remaining: number;
    limit: number;
};
export declare function consumeTokens(userId: string, tokens: number, tier?: string): void;
export declare function getCached(key: string): any | null;
export declare function setCache(key: string, data: any, ttlMs?: number): void;
export declare function clearCache(pattern?: string): void;
export declare function userRateLimitMiddleware(endpoint: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rate-limit.d.ts.map