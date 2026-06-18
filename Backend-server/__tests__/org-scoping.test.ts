import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/logger.js', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

function setupChain(result: any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  return chain;
}

const mockFrom = vi.fn();

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { supabase } from '../../src/lib/supabase.js';
import { resolveOrgContext, getQueryScope } from '../../src/middleware/org-scoping.js';

describe('Org Scoping Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveOrgContext', () => {
    it('sets orgId when user has current_org_id and active membership', async () => {
      mockFrom
        .mockReturnValueOnce(setupChain({ data: { id: 'user-1', current_org_id: 'org-1' }, error: null }))
        .mockReturnValueOnce(setupChain({ data: { role: 'admin', status: 'active' }, error: null }));

      const req = { user: { id: 'auth-1' }, internalUserId: undefined, orgId: undefined, orgRole: undefined } as any;
      const res = {} as any;
      const next = vi.fn();

      await resolveOrgContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.orgId).toBe('org-1');
      expect(req.orgRole).toBe('admin');
      expect(req.internalUserId).toBe('user-1');
    });

    it('passes through when current_org_id is null', async () => {
      mockFrom.mockReturnValueOnce(setupChain({ data: { id: 'user-1', current_org_id: null }, error: null }));

      const req = { user: { id: 'auth-1' }, internalUserId: undefined, orgId: undefined, orgRole: undefined } as any;
      const res = {} as any;
      const next = vi.fn();

      await resolveOrgContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.orgId).toBeUndefined();
    });

    it('passes through when membership is inactive', async () => {
      mockFrom
        .mockReturnValueOnce(setupChain({ data: { id: 'user-1', current_org_id: 'org-1' }, error: null }))
        .mockReturnValueOnce(setupChain({ data: { role: 'member', status: 'inactive' }, error: null }));

      const req = { user: { id: 'auth-1' }, internalUserId: undefined, orgId: undefined, orgRole: undefined } as any;
      const res = {} as any;
      const next = vi.fn();

      await resolveOrgContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.orgId).toBeUndefined();
    });

    it('passes through when no auth user', async () => {
      const req = { user: undefined, internalUserId: undefined, orgId: undefined, orgRole: undefined } as any;
      const res = {} as any;
      const next = vi.fn();

      await resolveOrgContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.orgId).toBeUndefined();
    });

    it('passes through on DB error', async () => {
      mockFrom.mockReturnValueOnce(setupChain({ data: null, error: { message: 'db error' } }));

      const req = { user: { id: 'auth-1' }, internalUserId: undefined, orgId: undefined, orgRole: undefined } as any;
      const res = {} as any;
      const next = vi.fn();

      await resolveOrgContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.orgId).toBeUndefined();
    });
  });

  describe('getQueryScope', () => {
    it('returns org scope when orgId is present', () => {
      const req = { internalUserId: 'u1', orgId: 'org-1' } as any;
      const scope = getQueryScope(req);
      expect(scope.orgId).toBe('org-1');
      expect(scope.userId).toBe('u1');
    });

    it('returns personal scope when no orgId', () => {
      const req = { internalUserId: 'u1', orgId: undefined } as any;
      const scope = getQueryScope(req);
      expect(scope.orgId).toBeNull();
      expect(scope.userId).toBe('u1');
    });

    it('uses empty userId as fallback', () => {
      const req = { internalUserId: undefined, orgId: undefined } as any;
      const scope = getQueryScope(req);
      expect(scope.orgId).toBeNull();
      expect(scope.userId).toBe('');
    });
  });
});
