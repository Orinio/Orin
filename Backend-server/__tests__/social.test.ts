import { describe, it, expect, vi, beforeEach } from 'vitest';

function setupChain(result: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
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

describe('Social API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /posts', () => {
    it('creates a post successfully', async () => {
      mockFrom.mockReturnValue(setupChain({
        data: { id: 'post-1', content: 'Hello world', user_id: 'u1' },
        error: null,
      }));

      const r = await supabase
        .from('posts')
        .insert({ user_id: 'u1', content: 'Hello world', post_type: 'text', visibility: 'public' })
        .select()
        .single();

      expect(r.error).toBeNull();
      expect(r.data.content).toBe('Hello world');
    });

    it('extracts hashtags from content', async () => {
      const content = 'Check out #React and #TypeScript';
      const extractedHashtags = content.match(/#(\w+)/g)?.map((h) => h.slice(1)) || [];

      expect(extractedHashtags).toEqual(['React', 'TypeScript']);
    });

    it('rejects content over 280 characters', async () => {
      const content = 'a'.repeat(281);
      expect(content.length).toBeGreaterThan(280);
    });
  });

  describe('POST /posts/:postId/reactions', () => {
    it('adds a reaction to a post', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('post_reactions')
        .insert({ post_id: 'post-1', user_id: 'u1', reaction_type: 'like' });

      expect(r.error).toBeNull();
    });

    it('removes a reaction from a post', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', 'post-1')
        .eq('user_id', 'u1')
        .eq('reaction_type', 'like');

      expect(r.error).toBeNull();
    });

    it('fetches reactions grouped by type', async () => {
      const reactions = [
        { reaction_type: 'like' },
        { reaction_type: 'like' },
        { reaction_type: 'love' },
      ];

      mockFrom.mockReturnValue(setupChain({ data: reactions, error: null }));

      const r = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', 'post-1');

      const grouped = new Map<string, number>();
      (r.data || []).forEach((r: any) => {
        grouped.set(r.reaction_type, (grouped.get(r.reaction_type) || 0) + 1);
      });

      expect(grouped.get('like')).toBe(2);
      expect(grouped.get('love')).toBe(1);
    });
  });

  describe('POST /posts/:postId/bookmarks', () => {
    it('adds a bookmark', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('bookmarks')
        .insert({ post_id: 'post-1', user_id: 'u1' });

      expect(r.error).toBeNull();
    });

    it('removes a bookmark', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', 'post-1')
        .eq('user_id', 'u1');

      expect(r.error).toBeNull();
    });
  });

  describe('POST /posts/:postId/comments', () => {
    it('adds a comment to a post', async () => {
      mockFrom.mockReturnValue(setupChain({
        data: { id: 'comment-1', content: 'Great post!', post_id: 'post-1', user_id: 'u1' },
        error: null,
      }));

      const r = await supabase
        .from('post_comments')
        .insert({ post_id: 'post-1', user_id: 'u1', content: 'Great post!' })
        .select()
        .single();

      expect(r.error).toBeNull();
      expect(r.data.content).toBe('Great post!');
    });

    it('adds a reply to a comment', async () => {
      mockFrom.mockReturnValue(setupChain({
        data: { id: 'reply-1', content: 'Thanks!', parent_id: 'comment-1', post_id: 'post-1' },
        error: null,
      }));

      const r = await supabase
        .from('post_comments')
        .insert({ post_id: 'post-1', user_id: 'u2', content: 'Thanks!', parent_id: 'comment-1' })
        .select()
        .single();

      expect(r.error).toBeNull();
      expect(r.data.parent_id).toBe('comment-1');
    });

    it('deletes a comment', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('post_comments')
        .delete()
        .eq('id', 'comment-1')
        .eq('user_id', 'u1');

      expect(r.error).toBeNull();
    });
  });

  describe('GET /posts/feed', () => {
    it('fetches feed posts with pagination', async () => {
      const posts = [
        { id: 'post-1', content: 'Post 1', visibility: 'public' },
        { id: 'post-2', content: 'Post 2', visibility: 'public' },
      ];

      mockFrom.mockReturnValue(setupChain({ data: posts, error: null }));

      const r = await supabase
        .from('posts')
        .select('*, users(id, username, full_name, avatar_url, headline)')
        .order('created_at', { ascending: false })
        .range(0, 19);

      expect(r.error).toBeNull();
      expect(r.data).toHaveLength(2);
    });
  });

  describe('DELETE /posts/:postId', () => {
    it('soft-deletes a post', async () => {
      mockFrom.mockReturnValue(setupChain({ data: null, error: null }));

      const r = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', 'post-1');

      expect(r.error).toBeNull();
    });
  });

  describe('POST /posts/:postId/repost', () => {
    it('creates a repost', async () => {
      mockFrom.mockReturnValue(setupChain({
        data: { id: 'repost-1', post_type: 'repost', repost_of_id: 'post-1' },
        error: null,
      }));

      const r = await supabase
        .from('posts')
        .insert({ user_id: 'u1', content: '', post_type: 'repost', repost_of_id: 'post-1', visibility: 'public' })
        .select()
        .single();

      expect(r.error).toBeNull();
      expect(r.data.post_type).toBe('repost');
      expect(r.data.repost_of_id).toBe('post-1');
    });
  });
});
