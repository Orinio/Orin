import { describe, it, expect } from 'vitest';
import { AppError, Errors } from '../src/lib/app-error.js';

describe('AppError', () => {
  it('should create an error with correct properties', () => {
    const err = new AppError('NOT_FOUND', 'User not found', 404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('User not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe('AppError');
  });

  it('should serialize to JSON with code and message', () => {
    const err = new AppError('VALIDATION_ERROR', 'Bad input', 400, { field: 'email' });
    const json = err.toJSON();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toBe('Bad input');
    expect(json.error.details).toEqual({ field: 'email' });
  });

  it('should default to 500 status', () => {
    const err = new AppError('INTERNAL_ERROR', 'Oops');
    expect(err.statusCode).toBe(500);
  });

  it('should be an instance of Error', () => {
    const err = Errors.notFound('Thing');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('Error factories', () => {
  it('unauthorized returns 401', () => {
    const err = Errors.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('forbidden returns 403', () => {
    const err = Errors.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('notFound returns 404 with resource name', () => {
    const err = Errors.notFound('User');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found');
  });

  it('validation returns 400', () => {
    const err = Errors.validation('Invalid email');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('missingFields returns 400 with field list', () => {
    const err = Errors.missingFields(['name', 'email']);
    expect(err.statusCode).toBe(400);
    expect(err.message).toContain('name');
    expect(err.message).toContain('email');
  });

  it('rateLimited returns 429', () => {
    const err = Errors.rateLimited('Too many requests', 5000);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMITED');
  });

  it('globalRateLimited returns 429', () => {
    const err = Errors.globalRateLimited(30000);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('GLOBAL_RATE_LIMITED');
  });

  it('dependencyFailed returns 503', () => {
    const err = Errors.dependencyFailed('Supabase', 'timeout');
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('DEPENDENCY_FAILED');
  });

  it('timeout returns 504', () => {
    const err = Errors.timeout('AI call');
    expect(err.statusCode).toBe(504);
    expect(err.code).toBe('TIMEOUT');
  });

  it('notConfigured returns 503', () => {
    const err = Errors.notConfigured('NVIDIA_API_KEY');
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('NOT_CONFIGURED');
  });

  it('externalServiceError returns 502', () => {
    const err = Errors.externalServiceError('NVIDIA NIM', 503);
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('EXTERNAL_SERVICE_ERROR');
  });

  it('internal returns 500', () => {
    const err = Errors.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });
});
