/**
 * Structured application error with HTTP status and error code.
 * Use these instead of throwing generic Errors throughout the codebase.
 */
export type ErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'MISSING_FIELDS' | 'RATE_LIMITED' | 'GLOBAL_RATE_LIMITED' | 'PLAN_RATE_LIMITED' | 'TOKEN_BUDGET_EXCEEDED' | 'CONFLICT' | 'DEPENDENCY_FAILED' | 'TIMEOUT' | 'INTERNAL_ERROR' | 'NOT_CONFIGURED' | 'EXTERNAL_SERVICE_ERROR';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: ErrorCode;
    readonly isOperational: boolean;
    readonly details?: Record<string, unknown>;
    constructor(code: ErrorCode, message: string, statusCode?: number, details?: Record<string, unknown>);
    toJSON(): {
        error: {
            details?: Record<string, unknown> | undefined;
            code: ErrorCode;
            message: string;
        };
    };
}
export declare const Errors: {
    unauthorized(message?: string): AppError;
    forbidden(message?: string): AppError;
    notFound(resource: string): AppError;
    validation(message: string, details?: Record<string, unknown>): AppError;
    missingFields(fields: string[]): AppError;
    rateLimited(reason: string, retryAfterMs?: number): AppError;
    tokenBudgetExceeded(plan: string, limit: number, retryAfterMs: number): AppError;
    globalRateLimited(retryAfterMs: number): AppError;
    planRateLimited(plan: string, endpoint: string, used: number, limit: number, retryAfterMs: number, upgradeMessage?: string): AppError;
    conflict(message: string): AppError;
    dependencyFailed(service: string, reason?: string): AppError;
    timeout(operation: string): AppError;
    notConfigured(resource: string): AppError;
    externalServiceError(service: string, status?: number): AppError;
    internal(message?: string): AppError;
};
//# sourceMappingURL=app-error.d.ts.map