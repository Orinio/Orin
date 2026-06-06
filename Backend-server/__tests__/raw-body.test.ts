import { describe, it, expect } from 'vitest';
import { rawBodyVerifier } from '../src/middleware/raw-body.js';

describe('Raw Body Verifier', () => {
  it('should capture raw body for webhook paths', () => {
    const req = { path: '/webhooks/stripe' } as any;
    const res = {} as any;
    const buf = Buffer.from('{"type":"checkout.session.completed"}');

    rawBodyVerifier(req, res, buf, 'utf-8');

    expect((req as any).rawBody).toBe('{"type":"checkout.session.completed"}');
  });

  it('should capture raw body for GitHub webhook paths', () => {
    const req = { path: '/webhooks/github' } as any;
    const res = {} as any;
    const buf = Buffer.from('{"action":"push"}');

    rawBodyVerifier(req, res, buf, 'utf-8');

    expect((req as any).rawBody).toBe('{"action":"push"}');
  });

  it('should NOT capture raw body for non-webhook paths', () => {
    const req = { path: '/ai/chat' } as any;
    const res = {} as any;
    const buf = Buffer.from('{"message":"hello"}');

    rawBodyVerifier(req, res, buf, 'utf-8');

    expect((req as any).rawBody).toBeUndefined();
  });

  it('should NOT capture raw body for health endpoint', () => {
    const req = { path: '/health' } as any;
    const res = {} as any;
    const buf = Buffer.from('{}');

    rawBodyVerifier(req, res, buf, 'utf-8');

    expect((req as any).rawBody).toBeUndefined();
  });
});
