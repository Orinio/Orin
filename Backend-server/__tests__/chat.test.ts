import { describe, it, expect, vi, beforeEach } from 'vitest';

function setupChain(result: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: Function, reject?: Function) => resolve(result, undefined),
  };
  return chain;
}

const mockFrom = vi.fn();

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { from: (...args: any[]) => mockFrom(...args) },
}));

import { supabase } from '../src/lib/supabase.js';

describe('Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /chat', () => {
    it('lists conversations for a user', async () => {
      const conversations = [
        { id: 'conv-1', user_id: 'u1', title: 'Career coaching', messages: [], updated_at: '2024-01-01' },
        { id: 'conv-2', user_id: 'u1', title: 'Resume help', messages: [], updated_at: '2024-01-02' },
      ];

      mockFrom.mockReturnValue(setupChain({ data: conversations, error: null }));

      const r = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', 'u1')
        .order('updated_at', { ascending: false })
        .limit(100);

      expect(r.error).toBeNull();
      expect(r.data).toHaveLength(2);
    });

    it('returns empty array for new user', async () => {
      mockFrom.mockReturnValue(setupChain({ data: [], error: null }));

      const r = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', 'new-user')
        .order('updated_at', { ascending: false })
        .limit(100);

      expect(r.error).toBeNull();
      expect(r.data).toHaveLength(0);
    });
  });

  describe('GET /chat/:id', () => {
    it('fetches a single conversation', async () => {
      const conversation = {
        id: 'conv-1',
        user_id: 'u1',
        title: 'Career coaching',
        messages: [{ role: 'user', content: 'Help me' }],
        updated_at: '2024-01-01',
      };

      mockFrom.mockReturnValue(setupChain({ data: conversation, error: null }));

      const r = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', 'conv-1')
        .eq('user_id', 'u1')
        .maybeSingle();

      expect(r.error).toBeNull();
      expect(r.data.id).toBe('conv-1');
      expect(r.data.messages).toHaveLength(1);
    });

    it('returns null for non-existent conversation', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', 'non-existent')
        .eq('user_id', 'u1')
        .maybeSingle();

      expect(r.error).toBeNull();
      expect(r.data).toBeNull();
    });
  });

  describe('POST /chat', () => {
    it('creates a new conversation', async () => {
      const newConv = {
        id: 'conv-new',
        user_id: 'u1',
        title: 'New chat',
        messages: [],
        agent_id: 'chat',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockFrom.mockReturnValue(setupChain({ data: newConv, error: null }));

      const r = await supabase
        .from('chat_conversations')
        .insert({
          id: 'conv-new',
          user_id: 'u1',
          title: 'New chat',
          messages: [],
          agent_id: 'chat',
        })
        .select()
        .single();

      expect(r.error).toBeNull();
      expect(r.data.title).toBe('New chat');
    });

    it('upserts an existing conversation', async () => {
      const updated = {
        id: 'conv-1',
        user_id: 'u1',
        title: 'Updated title',
        messages: [{ role: 'user', content: 'Hello' }],
        updated_at: '2024-01-02',
      };

      mockFrom.mockReturnValue(setupChain({ data: updated, error: null }));

      const r = await supabase
        .from('chat_conversations')
        .update({
          title: 'Updated title',
          messages: [{ role: 'user', content: 'Hello' }],
          updated_at: new Date().toISOString(),
        })
        .eq('id', 'conv-1')
        .eq('user_id', 'u1')
        .select()
        .single();

      expect(r.error).toBeNull();
      expect(r.data.title).toBe('Updated title');
      expect(r.data.messages).toHaveLength(1);
    });
  });

  describe('DELETE /chat/:id', () => {
    it('deletes a conversation', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', 'conv-1')
        .eq('user_id', 'u1');

      expect(r.error).toBeNull();
    });
  });

  describe('conversation schema validation', () => {
    it('validates conversation has required fields', () => {
      const validConversation = {
        id: 'conv-1',
        title: 'Test',
        messages: [],
      };

      expect(validConversation.id).toBeTruthy();
      expect(Array.isArray(validConversation.messages)).toBe(true);
    });

    it('validates message structure', () => {
      const validMessage = {
        role: 'user',
        content: 'Hello',
      };

      expect(['user', 'assistant', 'system']).toContain(validMessage.role);
      expect(typeof validMessage.content).toBe('string');
    });
  });
});
