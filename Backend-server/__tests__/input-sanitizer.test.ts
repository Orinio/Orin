import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { inputSanitizer } from '../src/middleware/input-sanitizer.js';

describe('inputSanitizer middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {} };
    res = {};
    next = vi.fn();
  });

  it('should call next', () => {
    inputSanitizer(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('should strip script tags from string values', () => {
    req.body = { name: '<script>alert("xss")</script>John' };
    inputSanitizer(req as Request, res as Response, next);
    expect(req.body.name).toBe('John');
  });

  it('should strip inline event handlers', () => {
    req.body = { text: 'Hello onclick=alert(1) world' };
    inputSanitizer(req as Request, res as Response, next);
    expect(req.body.text).not.toContain('onclick=');
  });

  it('should strip javascript: URIs', () => {
    req.body = { url: 'javascript:alert(1)' };
    inputSanitizer(req as Request, res as Response, next);
    expect(req.body.url).not.toContain('javascript:');
  });

  it('should not modify non-string values', () => {
    req.body = { count: 42, active: true, nested: { key: 'value' } };
    inputSanitizer(req as Request, res as Response, next);
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
  });

  it('should sanitize strings inside arrays', () => {
    req.body = { tags: ['<script>x</script>tag1', 'normal'] };
    inputSanitizer(req as Request, res as Response, next);
    expect(req.body.tags[0]).toBe('tag1');
    expect(req.body.tags[1]).toBe('normal');
  });

  it('should handle nested objects', () => {
    req.body = { user: { bio: '<script>evil</script>Hello' } };
    inputSanitizer(req as Request, res as Response, next);
    expect(req.body.user.bio).toBe('Hello');
  });

  it('should handle null/undefined body', () => {
    req.body = null;
    inputSanitizer(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
