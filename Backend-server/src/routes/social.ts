import { Router, type Request, type Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';

const socialRouter = Router();

// ═══════════════════════════════════════════
// POSTS
// ═══════════════════════════════════════════

// Create a new post
socialRouter.post('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, content, mediaUrls, postType, visibility, hashtags, mentions } = req.body;

    if (!userId || !content) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'userId and content are required' } });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ error: { code: 'CONTENT_TOO_LONG', message: 'Content must be 280 characters or less' } });
      return;
    }

    // Extract hashtags from content
    const extractedHashtags = content.match(/#(\w+)/g)?.map((h: string) => h.slice(1)) || [];
    const allHashtags = [...new Set([...(hashtags || []), ...extractedHashtags])];

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        media_urls: mediaUrls || [],
        post_type: postType || 'text',
        visibility: visibility || 'public',
        hashtags: allHashtags,
        mentions: mentions || [],
      })
      .select('*, users(id, username, full_name, avatar_url, headline)')
      .single();

    if (error) throw error;

    // Create activity
    await supabase.from('user_activities').insert({
      user_id: userId,
      activity_type: 'post',
      entity_type: 'post',
      entity_id: data.id,
    });

    res.json({ data });
  } catch (err) {
    logger.error({ err }, 'Error creating post');
    res.status(500).json({ error: { code: 'CREATE_POST_FAILED', message: 'Failed to create post' } });
  }
});

// Get feed posts (from followed users)
socialRouter.get('/posts/feed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      res.status(400).json({ error: { code: 'MISSING_USER_ID', message: 'userId is required' } });
      return;
    }

    // Get IDs of users the current user follows
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = (followData || []).map((f) => f.following_id);
    if (followingIds.length === 0) {
      res.json({ data: [] });
      return;
    }

    // Get posts from followed users
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, users(id, username, full_name, avatar_url, headline)')
      .in('user_id', followingIds)
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    res.json({ data: posts });
  } catch (err) {
    logger.error({ err }, 'Error fetching feed');
    res.status(500).json({ error: { code: 'FETCH_FEED_FAILED', message: 'Failed to fetch feed' } });
  }
});

// Get user posts
socialRouter.get('/posts/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, users(id, username, full_name, avatar_url, headline)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .is('reply_to_id', null)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    res.json({ data: posts });
  } catch (err) {
    logger.error({ err }, 'Error fetching user posts');
    res.status(500).json({ error: { code: 'FETCH_POSTS_FAILED', message: 'Failed to fetch user posts' } });
  }
});

// Get single post
socialRouter.get('/posts/:postId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const { data: post, error } = await supabase
      .from('posts')
      .select('*, users(id, username, full_name, avatar_url, headline)')
      .eq('id', postId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    res.json({ data: post });
  } catch (err) {
    logger.error({ err }, 'Error fetching post');
    res.status(500).json({ error: { code: 'FETCH_POST_FAILED', message: 'Failed to fetch post' } });
  }
});

// Update post
socialRouter.put('/posts/:postId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, visibility } = req.body;

    const extractedHashtags = content?.match(/#(\w+)/g)?.map((h: string) => h.slice(1)) || [];

    const { data, error } = await supabase
      .from('posts')
      .update({
        content,
        visibility,
        hashtags: extractedHashtags,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    logger.error({ err }, 'Error updating post');
    res.status(500).json({ error: { code: 'UPDATE_POST_FAILED', message: 'Failed to update post' } });
  }
});

// Delete post (soft delete)
socialRouter.delete('/posts/:postId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const { error } = await supabase
      .from('posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error deleting post');
    res.status(500).json({ error: { code: 'DELETE_POST_FAILED', message: 'Failed to delete post' } });
  }
});

// Repost
socialRouter.post('/posts/:postId/repost', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content || '',
        post_type: 'repost',
        repost_of_id: postId,
        visibility: 'public',
      })
      .select('*, users(id, username, full_name, avatar_url, headline)')
      .single();

    if (error) throw error;

    // Update repost count
    await supabase.rpc('increment_repost_count', { post_id: postId });

    res.json({ data });
  } catch (err) {
    logger.error({ err }, 'Error reposting');
    res.status(500).json({ error: { code: 'REPOST_FAILED', message: 'Failed to repost' } });
  }
});

// ═══════════════════════════════════════════
// REACTIONS
// ═══════════════════════════════════════════

// Toggle reaction on post
socialRouter.post('/posts/:postId/reactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { userId, reactionType, hasReacted } = req.body;

    if (hasReacted) {
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('post_reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType,
        });
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error toggling reaction');
    res.status(500).json({ error: { code: 'REACTION_FAILED', message: 'Failed to toggle reaction' } });
  }
});

// Get reactions for post
socialRouter.get('/posts/:postId/reactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.query.userId as string;

    const { data: allReactions } = await supabase
      .from('post_reactions')
      .select('reaction_type')
      .eq('post_id', postId);

    // Group reactions manually
    const reactionsMap = new Map<string, number>();
    (allReactions || []).forEach((r) => {
      const count = reactionsMap.get(r.reaction_type) || 0;
      reactionsMap.set(r.reaction_type, count + 1);
    });
    const reactions = Array.from(reactionsMap.entries()).map(([reaction_type, count]) => ({
      reaction_type,
      count,
    }));

    let userReactions: string[] = [];
    if (userId) {
      const { data } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', userId);
      userReactions = (data || []).map((r) => r.reaction_type);
    }

    res.json({ reactions, userReactions });
  } catch (err) {
    logger.error({ err }, 'Error fetching reactions');
    res.status(500).json({ error: { code: 'FETCH_REACTIONS_FAILED', message: 'Failed to fetch reactions' } });
  }
});

// ═══════════════════════════════════════════
// BOOKMARKS
// ═══════════════════════════════════════════

// Toggle bookmark
socialRouter.post('/posts/:postId/bookmarks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { userId, isBookmarked } = req.body;

    if (isBookmarked) {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          post_id: postId,
          user_id: userId,
        });
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error toggling bookmark');
    res.status(500).json({ error: { code: 'BOOKMARK_FAILED', message: 'Failed to toggle bookmark' } });
  }
});

// Get user bookmarks
socialRouter.get('/bookmarks/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('bookmarks')
      .select('post_id, created_at, posts(*, users(id, username, full_name, avatar_url, headline))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const bookmarks = (data || []).map((b: any) => ({
      ...b.posts,
      bookmarked_at: b.created_at,
    }));

    res.json({ data: bookmarks });
  } catch (err) {
    logger.error({ err }, 'Error fetching bookmarks');
    res.status(500).json({ error: { code: 'FETCH_BOOKMARKS_FAILED', message: 'Failed to fetch bookmarks' } });
  }
});

// ═══════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════

// Add comment to post
socialRouter.post('/posts/:postId/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { userId, content, parentId, replyToUserId } = req.body;

    if (!userId || !content) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'userId and content are required' } });
      return;
    }

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId || null,
        reply_to_user_id: replyToUserId || null,
      })
      .select('*, users(id, username, full_name, avatar_url)')
      .single();

    if (error) throw error;

    // Create activity
    await supabase.from('user_activities').insert({
      user_id: userId,
      activity_type: 'comment',
      entity_type: 'comment',
      entity_id: data.id,
    });

    res.json({ data });
  } catch (err) {
    logger.error({ err }, 'Error adding comment');
    res.status(500).json({ error: { code: 'ADD_COMMENT_FAILED', message: 'Failed to add comment' } });
  }
});

// Get comments for post
socialRouter.get('/posts/:postId/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.query.userId as string;

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('*, users(id, username, full_name, avatar_url), reply_to_user:users!reply_to_user_id(username, full_name)')
      .eq('post_id', postId)
      .is('deleted_at', null)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('post_comments')
          .select('*, users(id, username, full_name, avatar_url), reply_to_user:users!reply_to_user_id(username, full_name)')
          .eq('parent_id', comment.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        // Get user reactions
        let hasLiked = false;
        if (userId) {
          const { data: commentReactions } = await supabase
            .from('comment_reactions')
            .select('reaction_type')
            .eq('comment_id', comment.id)
            .eq('user_id', userId);
          hasLiked = (commentReactions || []).some((r) => r.reaction_type === 'like');
        }

        return {
          ...comment,
          has_liked: hasLiked,
          replies: replies || [],
        };
      })
    );

    res.json({ data: commentsWithReplies });
  } catch (err) {
    logger.error({ err }, 'Error fetching comments');
    res.status(500).json({ error: { code: 'FETCH_COMMENTS_FAILED', message: 'Failed to fetch comments' } });
  }
});

// Delete comment (soft delete)
socialRouter.delete('/comments/:commentId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    const { error } = await supabase
      .from('post_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error deleting comment');
    res.status(500).json({ error: { code: 'DELETE_COMMENT_FAILED', message: 'Failed to delete comment' } });
  }
});

// Toggle comment reaction
socialRouter.post('/comments/:commentId/reactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userId, reactionType, hasReacted } = req.body;

    if (hasReacted) {
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: userId,
          reaction_type: reactionType,
        });
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error toggling comment reaction');
    res.status(500).json({ error: { code: 'COMMENT_REACTION_FAILED', message: 'Failed to toggle comment reaction' } });
  }
});

// ═══════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════

// Get social notifications
socialRouter.get('/notifications/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('social_notifications')
      .select('*, actor:users!actor_id(username, full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    logger.error({ err }, 'Error fetching notifications');
    res.status(500).json({ error: { code: 'FETCH_NOTIFICATIONS_FAILED', message: 'Failed to fetch notifications' } });
  }
});

// Mark notifications as read
socialRouter.put('/notifications/:userId/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('social_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, 'Error marking notifications read');
    res.status(500).json({ error: { code: 'MARK_READ_FAILED', message: 'Failed to mark notifications as read' } });
  }
});

// Get unread notification count
socialRouter.get('/notifications/:userId/unread-count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { count, error } = await supabase
      .from('social_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (err) {
    logger.error({ err }, 'Error fetching unread count');
    res.status(500).json({ error: { code: 'FETCH_COUNT_FAILED', message: 'Failed to fetch unread count' } });
  }
});

// ═══════════════════════════════════════════
// USER DISCOVERY
// ═══════════════════════════════════════════

// Get suggested users
socialRouter.get('/users/suggested/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get users the current user follows
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    const followingIds = (followData || []).map((f) => f.following_id);
    followingIds.push(userId); // Exclude self

    // Get suggested users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, headline, location, bio')
      .not('id', 'in', `(${followingIds.join(',')})`)
      .eq('is_profile_public', true)
      .eq('account_status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ data: users });
  } catch (err) {
    logger.error({ err }, 'Error fetching suggested users');
    res.status(500).json({ error: { code: 'FETCH_SUGGESTED_FAILED', message: 'Failed to fetch suggested users' } });
  }
});

// Search users
socialRouter.get('/users/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const userId = req.query.userId as string;

    if (!query || query.length < 2) {
      res.json({ data: [] });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, headline, location, bio')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,headline.ilike.%${query}%`)
      .eq('is_profile_public', true)
      .eq('account_status', 'active')
      .is('deleted_at', null)
      .limit(20);

    if (error) throw error;

    // Check follow status
    let usersWithFollowStatus = data || [];
    if (userId && data) {
      const userIds = data.map((u) => u.id);
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', userIds);

      const followingSet = new Set((followData || []).map((f) => f.following_id));
      usersWithFollowStatus = data.map((user) => ({
        ...user,
        is_following: followingSet.has(user.id),
      }));
    }

    res.json({ data: usersWithFollowStatus });
  } catch (err) {
    logger.error({ err }, 'Error searching users');
    res.status(500).json({ error: { code: 'SEARCH_USERS_FAILED', message: 'Failed to search users' } });
  }
});

export { socialRouter };
