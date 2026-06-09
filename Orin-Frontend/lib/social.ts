import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ═══════════════════════════════════════════
// FOLLOW HOOKS
// ═══════════════════════════════════════════

export function useFollowStatus(targetUserId: string | null, currentUserId: string | null) {
  return useQuery({
    queryKey: ['follow-status', targetUserId, currentUserId],
    queryFn: async () => {
      if (!supabase || !targetUserId || !currentUserId) return { isFollowing: false, followerCount: 0, followingCount: 0 };

      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      const { count: followerCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

      return {
        isFollowing: !!followData,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      };
    },
    enabled: !!targetUserId && !!currentUserId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followerId, followingId, isFollowing }: { followerId: string; followingId: string; isFollowing: boolean }) => {
      if (!supabase) throw new Error('Supabase not configured');

      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', variables.followingId] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', variables.followerId] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

// ═══════════════════════════════════════════
// LIKE HOOKS
// ═══════════════════════════════════════════

export function useLikeStatus(proofCardId: string | null, currentUserId: string | null) {
  return useQuery({
    queryKey: ['like-status', proofCardId, currentUserId],
    queryFn: async () => {
      if (!supabase || !proofCardId || !currentUserId) return { hasLiked: false, likeCount: 0 };

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('proof_card_id', proofCardId)
        .maybeSingle();

      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('proof_card_id', proofCardId);

      return {
        hasLiked: !!data,
        likeCount: count || 0,
      };
    },
    enabled: !!proofCardId && !!currentUserId,
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, proofCardId, hasLiked }: { userId: string; proofCardId: string; hasLiked: boolean }) => {
      if (!supabase) throw new Error('Supabase not configured');

      if (hasLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('proof_card_id', proofCardId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, proof_card_id: proofCardId });
        if (error) throw error;
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['like-status', variables.proofCardId] });
      queryClient.invalidateQueries({ queryKey: ['proof-cards'] });
    },
  });
}

// ═══════════════════════════════════════════
// COMMENT HOOKS
// ═══════════════════════════════════════════

export interface Comment {
  id: string;
  user_id: string;
  proof_card_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  users?: { full_name: string | null; avatar_url: string | null; username: string } | null;
}

export function useComments(proofCardId: string | null) {
  return useQuery({
    queryKey: ['comments', proofCardId],
    queryFn: async () => {
      if (!supabase || !proofCardId) return [];

      const { data, error } = await supabase
        .from('comments')
        .select('*, users(full_name, avatar_url, username)')
        .eq('proof_card_id', proofCardId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Comment[];
    },
    enabled: !!proofCardId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, proofCardId, content, parentId }: { userId: string; proofCardId: string; content: string; parentId?: string }) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          proof_card_id: proofCardId,
          content,
          parent_id: parentId || null,
        })
        .select('*, users(full_name, avatar_url, username)')
        .single();

      if (error) throw error;
      return data as Comment;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.proofCardId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, proofCardId }: { commentId: string; proofCardId: string }) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.proofCardId] });
    },
  });
}

// ═══════════════════════════════════════════
// USER SEARCH
// ═══════════════════════════════════════════

export interface SearchResult {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      if (!supabase || !query || query.length < 2) return [];

      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, headline, location, bio')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,headline.ilike.%${query}%`)
        .eq('is_profile_public', true)
        .eq('account_status', 'active')
        .limit(20);

      if (error) throw error;
      return (data || []) as SearchResult[];
    },
    enabled: query.length >= 2,
  });
}

// ═══════════════════════════════════════════
// FEED — Posts from followed users
// ═══════════════════════════════════════════

export interface FeedPost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  skills: string[] | null;
  source_type: string;
  verification_status: string;
  source_url: string | null;
  created_at: string;
  users: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
  like_count: number;
  comment_count: number;
}

export function useFeed(currentUserId: string | null, page: number = 0, limit: number = 20) {
  return useQuery({
    queryKey: ['feed', currentUserId, page],
    queryFn: async () => {
      if (!supabase || !currentUserId) return [];

      // Get IDs of users the current user follows
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUserId);

      const followingIds = (followData || []).map((f) => f.following_id);

      if (followingIds.length === 0) return [];

      // Get proof cards from followed users
      const { data: proofs, error } = await supabase
        .from('proof_cards')
        .select('*, users(id, username, full_name, avatar_url, headline)')
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      // Get like/comment counts for each post
      const posts: FeedPost[] = [];
      for (const proof of proofs || []) {
        const { count: likeCount } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('proof_card_id', proof.id);

        const { count: commentCount } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('proof_card_id', proof.id);

        posts.push({
          ...proof,
          like_count: likeCount || 0,
          comment_count: commentCount || 0,
        });
      }

      return posts;
    },
    enabled: !!currentUserId,
  });
}

// ═══════════════════════════════════════════
// MESSAGING
// ═══════════════════════════════════════════

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  } | null;
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export function useConversations(currentUserId: string | null) {
  return useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: async () => {
      if (!supabase || !currentUserId) return [];

      // Get conversations the user is part of
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (!participants || participants.length === 0) return [];

      const convIds = participants.map((p) => p.conversation_id);

      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      // Build conversation list with other user info and last message
      const conversations: Conversation[] = [];
      for (const conv of convs || []) {
        // Get other participant
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', currentUserId)
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

        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', currentUserId)
          .is('read_at', null);

        conversations.push({
          ...conv,
          other_user: otherUser,
          last_message: lastMsg,
          unread_count: unreadCount || 0,
        });
      }

      return conversations;
    },
    enabled: !!currentUserId,
    refetchInterval: 5000, // Poll for new messages
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!supabase || !conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 3000, // Poll for new messages
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, senderId, content }: { conversationId: string; senderId: string; content: string }) => {
      if (!supabase) throw new Error('Supabase not configured');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data as Message;
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      if (!supabase) throw new Error('Supabase not configured');

      // Check if conversation already exists
      const { data: senderParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', senderId);

      if (senderParticipations) {
        for (const sp of senderParticipations) {
          const { data: existingConv } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', sp.conversation_id)
            .eq('user_id', receiverId)
            .maybeSingle();

          if (existingConv) {
            return sp.conversation_id; // Already exists
          }
        }
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conv.id, user_id: senderId },
          { conversation_id: conv.id, user_id: receiverId },
        ]);

      return conv.id;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
