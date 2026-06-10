import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export const socialRouter = Router();

// ───────────────────────────────────────────────────────────────
// FOLLOW
// ───────────────────────────────────────────────────────────────

socialRouter.get('/follow/status', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { targetUserId } = req.query;
    if (!targetUserId || typeof targetUserId !== 'string') {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'targetUserId is required' } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const [{ data: followData }, { count: followerCount }, { count: followingCount }] = await Promise.all([
      supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentDbUser.id)
        .eq('following_id', targetUserId)
        .maybeSingle(),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', targetUserId),
      supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', targetUserId),
    ]);

    res.json({
      success: true,
      data: {
        isFollowing: !!followData,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Follow status error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

const toggleFollowSchema = z.object({
  followingId: z.string().uuid(),
});

socialRouter.post('/follow/toggle', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = toggleFollowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    if (currentDbUser.id === parsed.data.followingId) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Cannot follow yourself' } });
      return;
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentDbUser.id)
      .eq('following_id', parsed.data.followingId)
      .maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
      res.json({ success: true, data: { isFollowing: false } });
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentDbUser.id, following_id: parsed.data.followingId });

      if (error) {
        res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
        return;
      }
      res.json({ success: true, data: { isFollowing: true } });
    }
  } catch (err) {
    logger.error({ err }, 'Follow toggle error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// ───────────────────────────────────────────────────────────────
// LIKE
// ───────────────────────────────────────────────────────────────

socialRouter.get('/like/status', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { proofCardId } = req.query;
    if (!proofCardId || typeof proofCardId !== 'string') {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'proofCardId is required' } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const [{ data }, { count }] = await Promise.all([
      supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentDbUser.id)
        .eq('proof_card_id', proofCardId)
        .maybeSingle(),
      supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('proof_card_id', proofCardId),
    ]);

    res.json({
      success: true,
      data: {
        hasLiked: !!data,
        likeCount: count || 0,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Like status error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

const toggleLikeSchema = z.object({
  proofCardId: z.string().uuid(),
});

socialRouter.post('/like/toggle', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = toggleLikeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', currentDbUser.id)
      .eq('proof_card_id', parsed.data.proofCardId)
      .maybeSingle();

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
      res.json({ success: true, data: { hasLiked: false } });
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: currentDbUser.id, proof_card_id: parsed.data.proofCardId });

      if (error) {
        res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
        return;
      }
      res.json({ success: true, data: { hasLiked: true } });
    }
  } catch (err) {
    logger.error({ err }, 'Like toggle error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// ───────────────────────────────────────────────────────────────
// COMMENTS
// ───────────────────────────────────────────────────────────────

socialRouter.get('/comments/:proofCardId', async (req, res) => {
  try {
    const { proofCardId } = req.params;

    const { data, error } = await supabase
      .from('comments')
      .select('*, users!inner(full_name, avatar_url, username)')
      .eq('proof_card_id', proofCardId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    logger.error({ err }, 'Comments list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

const addCommentSchema = z.object({
  proofCardId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

socialRouter.post('/comments', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = addCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: currentDbUser.id,
        proof_card_id: parsed.data.proofCardId,
        content: parsed.data.content,
        parent_id: parsed.data.parentId || null,
      })
      .select('*, users!inner(full_name, avatar_url, username)')
      .single();

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'Comment create error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

socialRouter.delete('/comments/:commentId', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { commentId } = req.params;

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: comment } = await supabase
      .from('comments')
      .select('user_id, proof_card_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Comment not found' } });
      return;
    }

    if (comment.user_id !== currentDbUser.id) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your comment' } });
      return;
    }

    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Comment delete error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// ───────────────────────────────────────────────────────────────
// FEED — Proof cards from followed users
// ───────────────────────────────────────────────────────────────

socialRouter.get('/feed', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const page = Math.max(0, parseInt(req.query.page as string) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentDbUser.id);

    const followingIds = (followData || []).map((f) => f.following_id);

    if (followingIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const { data: proofs, error } = await supabase
      .from('proof_cards')
      .select('*, users!inner(id, username, full_name, avatar_url, headline)')
      .in('user_id', followingIds)
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    const posts = await Promise.all(
      (proofs || []).map(async (proof) => {
        const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
          supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('proof_card_id', proof.id),
          supabase
            .from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('proof_card_id', proof.id),
        ]);

        return {
          ...proof,
          like_count: likeCount || 0,
          comment_count: commentCount || 0,
        };
      })
    );

    res.json({ success: true, data: posts });
  } catch (err) {
    logger.error({ err }, 'Feed error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// ───────────────────────────────────────────────────────────────
// USER SEARCH
// ───────────────────────────────────────────────────────────────

socialRouter.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, headline, location, bio')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%,headline.ilike.%${q}%`)
      .eq('is_profile_public', true)
      .eq('account_status', 'active')
      .is('deleted_at', null)
      .limit(20);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    logger.error({ err }, 'User search error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// ───────────────────────────────────────────────────────────────
// MESSAGING
// ───────────────────────────────────────────────────────────────

socialRouter.get('/conversations', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentDbUser.id);

    if (!participants || participants.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const convIds = participants.map((p) => p.conversation_id);

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    const conversations = await Promise.all(
      (convs || []).map(async (conv) => {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', currentDbUser.id)
          .limit(1)
          .single();

        let otherUser = null;
        if (otherParticipant) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, username, full_name, avatar_url, headline')
            .eq('id', otherParticipant.user_id)
            .single();
          otherUser = userData;
        }

        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', currentDbUser.id)
          .is('read_at', null);

        return {
          ...conv,
          other_user: otherUser,
          last_message: lastMsg,
          unread_count: unreadCount || 0,
        };
      })
    );

    res.json({ success: true, data: conversations });
  } catch (err) {
    logger.error({ err }, 'Conversations list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

socialRouter.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { conversationId } = req.params;

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', currentDbUser.id)
      .maybeSingle();

    if (!participant) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a participant' } });
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    logger.error({ err }, 'Messages list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

socialRouter.post('/messages', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', parsed.data.conversationId)
      .eq('user_id', currentDbUser.id)
      .maybeSingle();

    if (!participant) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not a participant' } });
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: parsed.data.conversationId,
        sender_id: currentDbUser.id,
        content: parsed.data.content,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, 'Message send error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

const startConversationSchema = z.object({
  receiverId: z.string().uuid(),
});

socialRouter.post('/conversations/start', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = startConversationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    if (currentDbUser.id === parsed.data.receiverId) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Cannot start conversation with yourself' } });
      return;
    }

    const { data: senderParticipations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentDbUser.id);

    if (senderParticipations) {
      for (const sp of senderParticipations) {
        const { data: existingConv } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('conversation_id', sp.conversation_id)
          .eq('user_id', parsed.data.receiverId)
          .maybeSingle();

        if (existingConv) {
          res.json({ success: true, data: { conversationId: sp.conversation_id } });
          return;
        }
      }
    }

    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: convError.message } });
      return;
    }

    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conv.id, user_id: currentDbUser.id },
        { conversation_id: conv.id, user_id: parsed.data.receiverId },
      ]);

    res.json({ success: true, data: { conversationId: conv.id } });
  } catch (err) {
    logger.error({ err }, 'Start conversation error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// Mark messages as read
const markReadSchema = z.object({
  conversationId: z.string().uuid(),
});

socialRouter.post('/messages/read', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const parsed = markReadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.errors[0].message } });
      return;
    }

    const { data: currentDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!currentDbUser) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', parsed.data.conversationId)
      .neq('sender_id', currentDbUser.id)
      .is('read_at', null);

    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', parsed.data.conversationId)
      .eq('user_id', currentDbUser.id);

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Mark read error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});
