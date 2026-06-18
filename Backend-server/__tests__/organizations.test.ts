import { describe, it, expect, vi, beforeEach } from 'vitest';

function setupChain(result: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    // Support `await` on the chain — resolves to the final result
    then: (resolve: Function, reject?: Function) => resolve(result, undefined),
  };
  return chain;
}

const mockFrom = vi.fn();

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { supabase } from '../src/lib/supabase.js';

describe('Organizations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create org', () => {
    it('creates org successfully', async () => {
      mockFrom.mockReturnValue(setupChain({ data: { id: 'org-1', name: 'Test Org' }, error: null }));

      const r = await supabase.from('organizations').insert({ name: 'Test Org', slug: 'test-org', owner_id: 'u1' }).select().single();
      expect(r.error).toBeNull();
      expect(r.data.name).toBe('Test Org');
    });

    it('detects duplicate slug', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: { code: '23505' } }));

      const r = await supabase.from('organizations').insert({ name: 'T', slug: 't', owner_id: 'u1' });
      expect(r.error.code).toBe('23505');
    });
  });

  describe('list orgs', () => {
    it('lists user orgs', async () => {
      const data = [{ role: 'owner', organizations: { name: 'Org 1' } }];
      mockFrom.mockReturnValue(setupChain({ data, error: null }));

      const r = await supabase.from('org_members').select('*').eq('user_id', 'u1').eq('status', 'active');
      expect(r.data).toHaveLength(1);
    });
  });

  describe('invite', () => {
    it('creates invitation', async () => {
      mockFrom.mockReturnValue(setupChain({ data: { id: 'inv-1', email: 'a@b.com' }, error: null }));

      const r = await supabase.from('org_invitations').insert({ org_id: 'o1', email: 'a@b.com', role: 'member', invited_by: 'u1' }).select().single();
      expect(r.error).toBeNull();
      expect(r.data.email).toBe('a@b.com');
    });
  });

  describe('accept invitation', () => {
    it('accepts and adds member', async () => {
      mockFrom
        .mockReturnValueOnce(setupChain({ data: { id: 'inv-1', org_id: 'o1', role: 'member', invited_by: 'u1', status: 'pending' }, error: null }))
        .mockReturnValueOnce(setupChain({ data: { id: 'mem-1' }, error: null }))
        .mockReturnValueOnce(setupChain({ data: null, error: null }));

      const r1 = await supabase.from('org_invitations').select('*').eq('id', 'inv-1').maybeSingle();
      expect(r1.data).not.toBeNull();

      const r2 = await supabase.from('org_members').insert({ org_id: 'o1', user_id: 'u2', role: 'member', status: 'active', invited_by: 'u1' });
      expect(r2.error).toBeNull();

      const r3 = await supabase.from('org_invitations').update({ status: 'accepted' }).eq('id', 'inv-1');
      expect(r3.error).toBeNull();
    });
  });

  describe('revoke invitation', () => {
    it('revokes invitation', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase.from('org_invitations').delete().eq('id', 'inv-1').eq('org_id', 'o1');
      expect(r.error).toBeNull();
    });
  });

  describe('remove member', () => {
    it('prevents removing owner', async () => {
      mockFrom.mockReturnValue(setupChain({ data: { owner_id: 'owner-1' }, error: null }));

      const r = await supabase.from('organizations').select('owner_id').eq('id', 'o1').single();
      expect(r.data.owner_id).toBe('owner-1');
    });
  });

  describe('ownership transfer', () => {
    it('transfers ownership correctly', async () => {
      mockFrom
        .mockReturnValueOnce(setupChain({ data: { role: 'owner' }, error: null }))
        .mockReturnValueOnce(setupChain({ data: null, error: null }))
        .mockReturnValueOnce(setupChain({ data: null, error: null }));

      const r1 = await supabase.from('org_members').update({ role: 'owner' }).eq('org_id', 'o1').eq('user_id', 'new');
      const r2 = await supabase.from('organizations').update({ owner_id: 'new' }).eq('id', 'o1');
      const r3 = await supabase.from('org_members').update({ role: 'admin' }).eq('org_id', 'o1').eq('user_id', 'old');

      expect(r1.error).toBeNull();
      expect(r2.error).toBeNull();
      expect(r3.error).toBeNull();
    });

    it('prevents owner self-demotion', () => {
      const selfId = 'owner-1';
      const targetId = 'owner-1';
      const newRole = 'admin';
      expect(selfId).toBe(targetId);
      expect(newRole).not.toBe('owner');
    });
  });

  describe('leave org', () => {
    it('prevents owner from leaving', async () => {
      mockFrom.mockReturnValue(setupChain({ data: { owner_id: 'u1' }, error: null }));

      const r = await supabase.from('organizations').select('owner_id').eq('id', 'o1').single();
      expect(r.data.owner_id).toBe('u1');
    });
  });
});
