"use strict";
/**
 * Structured application error with HTTP status and error code.
 * Use these instead of throwing generic Errors throughout the codebase.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                ...(this.details && { details: this.details }),
            },
        };
    }
}
exports.AppError = AppError;
// ---- Pre-built error factories ----
exports.Errors = {
    unauthorized(message = 'Authentication required') {
        return new AppError('UNAUTHORIZED', message, 401);
    },
    forbidden(message = 'Insufficient permissions') {
        return new AppError('FORBIDDEN', message, 403);
    },
    notFound(resource) {
        return new AppError('NOT_FOUND', `${resource} not found`, 404);
    },
    validation(message, details) {
        return new AppError('VALIDATION_ERROR', message, 400, details);
    },
    missingFields(fields) {
        return new AppError('MISSING_FIELDS', `Missing required fields: ${fields.join(', ')}`, 400, { fields });
    },
    rateLimited(reason, retryAfterMs) {
        return new AppError('RATE_LIMITED', reason, 429, { retryAfterMs });
    },
    tokenBudgetExceeded(plan, limit, retryAfterMs) {
        return new AppError('TOKEN_BUDGET_EXCEEDED', `Daily token budget of ${limit.toLocaleString()} exceeded on ${plan.toUpperCase()} plan.`, 429, {
            plan,
            tokenBudget: { limit, remaining: 0 },
            retryAfterMs,
            retryAfterDisplay: '24 hours (resets daily)',
        });
    },
    globalRateLimited(retryAfterMs) {
        return new AppError('GLOBAL_RATE_LIMITED', `AI rate limit exceeded. Retry in ${Math.ceil(retryAfterMs / 1000)}s.`, 429, { retryAfterMs });
    },
    planRateLimited(plan, endpoint, used, limit, retryAfterMs, upgradeMessage) {
        const waitMinutes = Math.ceil(retryAfterMs / 60000);
        const waitDisplay = waitMinutes > 60
            ? `${Math.ceil(waitMinutes / 60)} hour${Math.ceil(waitMinutes / 60) > 1 ? 's' : ''}`
            : `${waitMinutes} minute${waitMinutes > 1 ? 's' : ''}`;
        return new AppError('PLAN_RATE_LIMITED', `${plan.toUpperCase()} plan limit reached for ${endpoint}. Try again in ${waitDisplay}.`, 429, {
            plan,
            endpoint,
            usage: { used, limit, remaining: Math.max(0, limit - used) },
            retryAfterMs,
            upgradeMessage,
        });
    },
    conflict(message) {
        return new AppError('CONFLICT', message, 409);
    },
    dependencyFailed(service, reason) {
        return new AppError('DEPENDENCY_FAILED', `${service} unavailable${reason ? `: ${reason}` : ''}`, 503, { service });
    },
    timeout(operation) {
        return new AppError('TIMEOUT', `${operation} timed out`, 504);
    },
    notConfigured(resource) {
        return new AppError('NOT_CONFIGURED', `${resource} not configured`, 503);
    },
    externalServiceError(service, status) {
        return new AppError('EXTERNAL_SERVICE_ERROR', `${service} returned error${status ? ` ${status}` : ''}`, 502, { service, status });
    },
    internal(message = 'Internal server error') {
        return new AppError('INTERNAL_ERROR', message, 500);
    },
};
//# sourceMappingURL=app-error.js.map