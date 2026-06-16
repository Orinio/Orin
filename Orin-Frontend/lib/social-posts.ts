import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const db = supabase as any;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface SocialPost {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  post_type: 'text' | 'image' | 'link' | 'repost' | 'article';
  visibility: 'public' | 'followers' | 'private';
  reply_to_id: string | null;
  repost_of_id: string | null;
  hashtags: string[];
  mentions: string[];
  like_count: number;
  comment_count: number;
  repost_count: number;
  bookmark_count: number;
  view_count: number;
  is_pinned: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
  repost_of?: SocialPost | null;
  has_liked?: boolean;
  has_bookmarked?: boolean;
  user_reactions?: string[];
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  reply_to_user_id: string | null;
  like_count: number;
  reply_count: number;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  reply_to_user?: {
    username: string;
    full_name: string | null;
  } | null;
  replies?: PostComment[];
  has_liked?: boolean;
}

export interface SocialNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  action_type: 'like' | 'comment' | 'follow' | 'mention' | 'repost' | 'bookmark';
  entity_type: 'post' | 'comment' | 'user';
  entity_id: string;
  entity_preview: string | null;
  read_at: string | null;
  created_at: string;
  actor?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ═══════════════════════════════════════════
// POSTS HOOKS
// ═══════════════════════════════════════════

export function useSocialFeed(userId: string | null, page: number = 0, limit: number = 20) {
  return useQuery({
    queryKey: ['social-feed', userId, page],
    queryFn: async () => {
      if (!db || !userId) return [];

      // Get IDs of users the current user follows
      const { data: followData } = await db
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = (followData || []).map((f) => f.following_id);
      if (followingIds.length === 0) return [];

      // Get posts from followed users
      const { data: posts, error } = await db
        .from('posts')
        .select('*, users(id, username, full_name, avatar_url, headline)')
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      // Get user reactions for these posts
      const postIds = (posts || []).map((p: any) => p.id);
      const { data: reactions } = await db
        .from('post_reactions')
        .select('post_id, reaction_type')
        .in('post_id', postIds)
        .eq('user_id', userId);

      const { data: bookmarks } = await db
        .from('bookmarks')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', userId);

      // Map reactions to posts
      const reactionsByPost = ((reactions || []) as Array<{ post_id: string; reaction_type: string }>).reduce((acc, r) => {
        if (!acc[r.post_id]) acc[r.post_id] = [];
        acc[r.post_id].push(r.reaction_type);
        return acc;
      }, {} as Record<string, string[]>);

      const bookmarkedPosts = new Set(((bookmarks || []) as Array<{ post_id: string }>).map((b) => b.post_id));

      return (posts || []).map((post) => ({
        ...post,
        has_liked: (reactionsByPost[post.id] || []).includes('like'),
        has_bookmarked: bookmarkedPosts.has(post.id),
        user_reactions: reactionsByPost[post.id] || [],
      })) as SocialPost[];
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

export function useUserPosts(userId: string | null, page: number = 0, limit: number = 20) {
  return useQuery({
    queryKey: ['user-posts', userId, page],
    queryFn: async () => {
      if (!db || !userId) return [];

      const { data: posts, error } = await db
        .from('posts')
        .select('*, users(id, username, full_name, avatar_url, headline)')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .is('reply_to_id', null)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;
      return (posts || []) as SocialPost[];
    },
    enabled: !!userId,
  });
}

export function usePost(postId: string | null) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!db || !postId) return null;

      const { data: post, error } = await db
        .from('posts')
        .select('*, users(id, username, full_name, avatar_url, headline)')
        .eq('id', postId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return post as SocialPost;
    },
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      content,
      mediaUrls,
      postType,
      visibility,
      hashtags,
      mentions,
    }: {
      userId: string;
      content: string;
      mediaUrls?: string[];
      postType?: SocialPost['post_type'];
      visibility?: SocialPost['visibility'];
      hashtags?: string[];
      mentions?: string[];
    }) => {
      if (!db) throw new Error('Supabase not configured');

      // Extract hashtags and mentions from content
      const extractedHashtags = content.match(/#(\w+)/g)?.map((h) => h.slice(1)) || [];
      const allHashtags = [...new Set([...(hashtags || []), ...extractedHashtags])];

      const { data, error } = await db
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
      await db.from('user_activities').insert({
        user_id: userId,
        activity_type: 'post',
        entity_type: 'post',
        entity_id: data.id,
      });

      return data as SocialPost;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      visibility,
    }: {
      postId: string;
      content: string;
      visibility?: SocialPost['visibility'];
    }) => {
      if (!db) throw new Error('Supabase not configured');

      const extractedHashtags = content.match(/#(\w+)/g)?.map((h) => h.slice(1)) || [];

      const { data, error } = await db
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
      return data as SocialPost;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!db) throw new Error('Supabase not configured');

      const { error } = await db
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });
}

export function useRepost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      repostOfId,
      content,
    }: {
      userId: string;
      repostOfId: string;
      content?: string;
    }) => {
      if (!db) throw new Error('Supabase not configured');

      const { data, error } = await db
        .from('posts')
        .insert({
          user_id: userId,
          content: content || '',
          post_type: 'repost',
          repost_of_id: repostOfId,
          visibility: 'public',
        })
        .select('*, users(id, username, full_name, avatar_url, headline)')
        .single();

      if (error) throw error;

      // Update repost count
      await db.rpc('increment_repost_count', { post_id: repostOfId });

      return data as SocialPost;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    },
  });
}

// ═══════════════════════════════════════════
// REACTIONS HOOKS
// ═══════════════════════════════════════════

export function usePostReactions(postId: string | null, userId: string | null) {
  return useQuery({
    queryKey: ['post-reactions', postId, userId],
    queryFn: async () => {
      if (!db || !postId || !userId) return { reactions: [], userReactions: [] };

      const { data: reactions } = await db
        .from('post_reactions')
        .select('reaction_type, count')
        .eq('post_id', postId)
        .group('reaction_type');

      const { data: userReactions } = await db
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', userId);

      return {
        reactions: reactions || [],
        userReactions: (userReactions || []).map((r) => r.reaction_type),
      };
    },
    enabled: !!postId && !!userId,
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      userId,
      reactionType,
      hasReacted,
    }: {
      postId: string;
      userId: string;
      reactionType: string;
      hasReacted: boolean;
    }) => {
      if (!db) throw new Error('Supabase not configured');

      if (hasReacted) {
        const { error } = await db
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('reaction_type', reactionType);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: reactionType,
          });
        if (error) throw error;
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-reactions', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    },
  });
}

// ═══════════════════════════════════════════
// BOOKMARKS HOOKS
// ═══════════════════════════════════════════

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      userId,
      isBookmarked,
    }: {
      postId: string;
      userId: string;
      isBookmarked: boolean;
    }) => {
      if (!db) throw new Error('Supabase not configured');

      if (isBookmarked) {
        const { error } = await db
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('bookmarks')
          .insert({
            post_id: postId,
            user_id: userId,
          });
        if (error) throw error;
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useBookmarks(userId: string | null) {
  return useQuery({
    queryKey: ['bookmarks', userId],
    queryFn: async () => {
      if (!db || !userId) return [];

      const { data, error } = await db
        .from('bookmarks')
        .select('post_id, created_at, posts(*, users(id, username, full_name, avatar_url, headline))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((b) => ({
        ...b.posts,
        bookmarked_at: b.created_at,
      })) as SocialPost[];
    },
    enabled: !!userId,
  });
}

// ═══════════════════════════════════════════
// COMMENTS HOOKS (Enhanced)
// ═══════════════════════════════════════════

export function usePostComments(postId: string | null, userId: string | null) {
  return useQuery({
    queryKey: ['post-comments', postId, userId],
    queryFn: async () => {
      if (!db || !postId) return [];

      const { data: comments, error } = await db
        .from('post_comments')
        .select('*, users(id, username, full_name, avatar_url), reply_to_user:users!reply_to_user_id(username, full_name)')
        .eq('post_id', postId)
        .is('deleted_at', null)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get replies for each comment
      return await Promise.all(
        (comments || []).map(async (comment) => {
          const { data: replies } = await db
            .from('post_comments')
            .select('*, users(id, username, full_name, avatar_url), reply_to_user:users!reply_to_user_id(username, full_name)')
            .eq('parent_id', comment.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true });

          // Get user reactions for replies
          let repliesWithReactions = replies || [];
          if (userId && replies && replies.length > 0) {
            const replyIds = replies.map((r) => r.id);
            const { data: replyReactions } = await db
              .from('comment_reactions')
              .select('comment_id, reaction_type')
              .in('comment_id', replyIds)
              .eq('user_id', userId);

            const reactionsByComment = (replyReactions || []).reduce((acc, r) => {
              if (!acc[r.comment_id]) acc[r.comment_id] = [];
              acc[r.comment_id].push(r.reaction_type);
              return acc;
            }, {} as Record<string, string[]>);

            repliesWithReactions = replies.map((r) => ({
              ...r,
              has_liked: (reactionsByComment[r.id] || []).includes('like'),
            }));
          }

          // Get user reactions for parent comment
          let hasLiked = false;
          if (userId) {
            const { data: commentReactions } = await db
              .from('comment_reactions')
              .select('reaction_type')
              .eq('comment_id', comment.id)
              .eq('user_id', userId);
            hasLiked = (commentReactions || []).some((r) => r.reaction_type === 'like');
          }

          return {
            ...comment,
            has_liked: hasLiked,
            replies: repliesWithReactions,
          };
        })
      ) as PostComment[];
    },
    enabled: !!postId,
  });
}

export function useAddPostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      userId,
      content,
      parentId,
      replyToUserId,
    }: {
      postId: string;
      userId: string;
      content: string;
      parentId?: string;
      replyToUserId?: string;
    }) => {
      if (!db) throw new Error('Supabase not configured');

      const { data, error } = await db
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
      await db.from('user_activities').insert({
        user_id: userId,
        activity_type: 'comment',
        entity_type: 'comment',
        entity_id: data.id,
      });

      return data as PostComment;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

export function useDeletePostComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string; postId: string }) => {
      if (!db) throw new Error('Supabase not configured');

      const { error } = await db
        .from('post_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

export function useToggleCommentReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      userId,
      reactionType,
      hasReacted,
    }: {
      commentId: string;
      userId: string;
      reactionType: string;
      hasReacted: boolean;
    }) => {
      if (!db) throw new Error('Supabase not configured');

      if (hasReacted) {
        const { error } = await db
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .eq('reaction_type', reactionType);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: userId,
            reaction_type: reactionType,
          });
        if (error) throw error;
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments'] });
    },
  });
}

// ═══════════════════════════════════════════
// NOTIFICATIONS HOOKS
// ═══════════════════════════════════════════

export function useSocialNotifications(userId: string | null) {
  return useQuery({
    queryKey: ['social-notifications', userId],
    queryFn: async () => {
      if (!db || !userId) return [];

      const { data, error } = await db
        .from('social_notifications')
        .select('*, actor:users!actor_id(username, full_name, avatar_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as SocialNotification[];
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!db) throw new Error('Supabase not configured');

      const { error } = await db
        .from('social_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['social-notifications'] });
    },
  });
}

export function useUnreadNotificationCount(userId: string | null) {
  return useQuery({
    queryKey: ['unread-notifications-count', userId],
    queryFn: async () => {
      if (!db || !userId) return 0;

      const { count, error } = await db
        .from('social_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

// ═══════════════════════════════════════════
// USER DISCOVERY HOOKS
// ═══════════════════════════════════════════

export interface DiscoverableUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  follower_count?: number;
  is_following?: boolean;
}

export function useSuggestedUsers(userId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['suggested-users', userId, limit],
    queryFn: async () => {
      if (!db || !userId) return [];

      // Get users the current user follows
      const { data: followData } = await db
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = (followData || []).map((f) => f.following_id);
      followingIds.push(userId); // Exclude self

      // Get suggested users (not followed, with public profiles)
      const { data: users, error } = await db
        .from('users')
        .select('id, username, full_name, avatar_url, headline, location, bio')
        .not('id', 'in', `(${followingIds.join(',')})`)
        .eq('is_profile_public', true)
        .eq('account_status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (users || []) as DiscoverableUser[];
    },
    enabled: !!userId,
  });
}

export function useSearchUsers(query: string, userId: string | null) {
  return useQuery({
    queryKey: ['search-users', query, userId],
    queryFn: async () => {
      if (!db || !query || query.length < 2) return [];

      const { data, error } = await db
        .from('users')
        .select('id, username, full_name, avatar_url, headline, location, bio')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,headline.ilike.%${query}%`)
        .eq('is_profile_public', true)
        .eq('account_status', 'active')
        .is('deleted_at', null)
        .limit(20);

      if (error) throw error;

      // Check follow status for each user
      if (userId && data) {
        const userIds = data.map((u) => u.id);
        const { data: followData } = await db
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .in('following_id', userIds);

        const followingSet = new Set((followData || []).map((f) => f.following_id));

        return data.map((user) => ({
          ...user,
          is_following: followingSet.has(user.id),
        })) as DiscoverableUser[];
      }

      return (data || []) as DiscoverableUser[];
    },
    enabled: query.length >= 2,
  });
}
