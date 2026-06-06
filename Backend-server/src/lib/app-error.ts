/**
 * Structured application error with HTTP status and error code.
 * Use these instead of throwing generic Errors throughout the codebase.
 */

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'MISSING_FIELDS'
  | 'RATE_LIMITED'
  | 'GLOBAL_RATE_LIMITED'
  | 'CONFLICT'
  | 'DEPENDENCY_FAILED'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR'
  | 'NOT_CONFIGURED'
  | 'EXTERNAL_SERVICE_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
  ) {
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

// ---- Pre-built error factories ----

export const Errors = {
  unauthorized(message = 'Authentication required') {
    return new AppError('UNAUTHORIZED', message, 401);
  },

  forbidden(message = 'Insufficient permissions') {
    return new AppError('FORBIDDEN', message, 403);
  },

  notFound(resource: string) {
    return new AppError('NOT_FOUND', `${resource} not found`, 404);
  },

  validation(message: string, details?: Record<string, unknown>) {
    return new AppError('VALIDATION_ERROR', message, 400, details);
  },

  missingFields(fields: string[]) {
    return new AppError('MISSING_FIELDS', `Missing required fields: ${fields.join(', ')}`, 400, { fields });
  },

  rateLimited(reason: string, retryAfterMs?: number) {
    return new AppError('RATE_LIMITED', reason, 429, { retryAfterMs });
  },

  globalRateLimited(retryAfterMs: number) {
    return new AppError('GLOBAL_RATE_LIMITED', `AI rate limit exceeded. Retry in ${Math.ceil(retryAfterMs / 1000)}s.`, 429, { retryAfterMs });
  },

  conflict(message: string) {
    return new AppError('CONFLICT', message, 409);
  },

  dependencyFailed(service: string, reason?: string) {
    return new AppError('DEPENDENCY_FAILED', `${service} unavailable${reason ? `: ${reason}` : ''}`, 503, { service });
  },

  timeout(operation: string) {
    return new AppError('TIMEOUT', `${operation} timed out`, 504);
  },

  notConfigured(resource: string) {
    return new AppError('NOT_CONFIGURED', `${resource} not configured`, 503);
  },

  externalServiceError(service: string, status?: number) {
    return new AppError('EXTERNAL_SERVICE_ERROR', `${service} returned error${status ? ` ${status}` : ''}`, 502, { service, status });
  },

  internal(message = 'Internal server error') {
    return new AppError('INTERNAL_ERROR', message, 500);
  },
};
