'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  generateKeyPair,
  encryptForConversation,
  decryptFromConversation,
  hasPrivateKey,
  type EncryptedPayload,
} from '@/lib/encryption';
import type { Database } from '@/lib/supabase';

type DB = Database;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface Conversation {
  id: string;
  name: string | null;
  conversation_type: string;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  participants: ConversationParticipant[];
  unread_count: number;
}

export interface ConversationParticipant {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  public_key: string | null;
  online?: boolean;
  last_seen?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string; // encrypted ciphertext or plaintext for system messages
  encryption_iv: string | null;
  encryption_salt: string | null;
  message_type: string;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
  // Decrypted content (client-side only)
  decrypted_content?: string;
  sender_name?: string;
  sender_avatar?: string;
}

// ═══════════════════════════════════════════
// KEY MANAGEMENT HOOKS
// ═══════════════════════════════════════════

/**
 * Initialize encryption keys for the current user.
 * Called once on login to ensure keys exist.
 */
export function useInitializeKeys(userId: string | null) {
  useEffect(() => {
    if (!userId || !supabase) return;

    const initKeys = async () => {
      try {
        const hasKeys = await hasPrivateKey(userId);
        if (!hasKeys) {
          // Generate new key pair
          const publicKey = await generateKeyPair(userId);

          // Store public key in database
          await supabase
            .from('users')
            .update({ public_key: publicKey })
            .eq('auth_user_id', userId);
        } else {
          // Ensure public key is in DB (might have been lost)
          const { data: user } = await supabase
            .from('users')
            .select('public_key')
            .eq('auth_user_id', userId)
            .single();

          if (!user?.public_key) {
            const publicKey = await generateKeyPair(userId);
            await supabase
              .from('users')
              .update({ public_key: publicKey })
              .eq('auth_user_id', userId);
          }
        }
      } catch (err) {
        console.error('Failed to initialize encryption keys:', err);
      }
    };

    initKeys();
  }, [userId]);
}

// ═══════════════════════════════════════════
// CONVERSATION HOOKS
// ═══════════════════════════════════════════

/**
 * Fetch all conversations for the current user.
 */
export function useConversations(userId: string | null) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      if (!supabase || !userId) return [];

      // Get user's DB id
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!currentUser) return [];

      // Get conversations the user is part of
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (!participations || participations.length === 0) return [];

      const conversationIds = participations.map(p => p.conversation_id);

      // Get conversation details
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (!conversations) return [];

      // Get participants for each conversation
      const result: Conversation[] = [];

      for (const conv of conversations) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            last_read_at,
            users:user_id (
              id,
              full_name,
              avatar_url,
              username,
              public_key
            )
          `)
          .eq('conversation_id', conv.id);

        const participantList: ConversationParticipant[] = (participants || [])
          .filter(p => p.users)
          .map(p => {
            const user = p.users as unknown as {
              id: string;
              full_name: string | null;
              avatar_url: string | null;
              username: string | null;
              public_key: string | null;
            };
            return {
              user_id: user.id,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              username: user.username,
              public_key: user.public_key,
            };
          });

        // Get unread count
        const myParticipation = participants?.find(p => p.user_id === currentUser.id);
        const lastRead = myParticipation?.last_read_at;

        let unreadCount = 0;
        if (lastRead) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUser.id)
            .gt('created_at', lastRead);
          unreadCount = count || 0;
        } else {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUser.id);
          unreadCount = count || 0;
        }

        // For direct conversations, use the other person's name as the conversation name
        let displayName = conv.name;
        if (conv.conversation_type === 'direct' && participantList.length === 2) {
          const other = participantList.find(p => p.user_id !== currentUser.id);
          if (other) {
            displayName = other.full_name || other.username || 'Unknown';
          }
        }

        result.push({
          ...conv,
          name: displayName,
          participants: participantList,
          unread_count: unreadCount,
        });
      }

      // Sort by last message time
      result.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      return result;
    },
    enabled: !!userId,
    refetchInterval: 10000, // Refetch every 10s for new conversations
  });
}

/**
 * Create a new direct conversation with another user.
 */
export function useCreateConversation(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!supabase || !userId) throw new Error('Not authenticated');

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!currentUser) throw new Error('User not found');

      // Check if conversation already exists between these two users
      const { data: existingParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (existingParticipations) {
        for (const p of existingParticipations) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', p.conversation_id)
            .eq('user_id', otherUserId)
            .single();

          if (otherParticipant) {
            // Conversation already exists
            return p.conversation_id;
          }
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          conversation_type: 'direct',
        })
        .select('id')
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: currentUser.id },
          { conversation_id: conversation.id, user_id: otherUserId },
        ]);

      if (partError) throw partError;

      return conversation.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// ═══════════════════════════════════════════
// MESSAGE HOOKS
// ═══════════════════════════════════════════

/**
 * Fetch messages for a conversation with decryption.
 */
export function useMessages(
  conversationId: string | null,
  userId: string | null,
  otherUserPublicKey: string | null
) {
  return useQuery({
    queryKey: ['messages', conversationId, userId],
    queryFn: async () => {
      if (!supabase || !conversationId || !userId) return [];

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!currentUser) return [];

      // Fetch messages
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!messages) return [];

      // Get sender info
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: senders } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', senderIds);

      const senderMap = new Map(
        (senders || []).map(s => [s.id, s])
      );

      // Decrypt messages
      const decryptedMessages: ChatMessage[] = [];

      for (const msg of messages) {
        const sender = senderMap.get(msg.sender_id);
        let decryptedContent = msg.content;

        // Try to decrypt if it's an encrypted message
        if (msg.message_type === 'encrypted' && msg.encryption_iv && otherUserPublicKey) {
          try {
            const payload: EncryptedPayload = {
              ciphertext: msg.content,
              iv: msg.encryption_iv,
              salt: msg.encryption_salt || '',
            };
            decryptedContent = await decryptFromConversation(
              userId,
              otherUserPublicKey,
              payload
            );
          } catch {
            // Decryption failed - might be from before keys were set up
            decryptedContent = '[Unable to decrypt message]';
          }
        }

        decryptedMessages.push({
          ...msg,
          decrypted_content: decryptedContent,
          sender_name: sender?.full_name || 'Unknown',
          sender_avatar: sender?.avatar_url || null,
        });
      }

      return decryptedMessages;
    },
    enabled: !!conversationId && !!userId,
  });
}

/**
 * Send an encrypted message.
 */
export function useSendMessage(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      recipientPublicKey,
    }: {
      conversationId: string;
      content: string;
      recipientPublicKey: string;
    }) => {
      if (!supabase || !userId) throw new Error('Not authenticated');

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!currentUser) throw new Error('User not found');

      // Encrypt the message
      const encrypted = await encryptForConversation(
        userId,
        recipientPublicKey,
        content
      );

      // Store encrypted message
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: encrypted.ciphertext,
          encryption_iv: encrypted.iv,
          encryption_salt: encrypted.salt,
          message_type: 'encrypted',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message_preview: '🔒 Encrypted message',
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return message.id;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Mark conversation as read.
 */
export function useMarkAsRead(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!supabase || !userId) return;

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!currentUser) return;

      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/**
 * Real-time message subscription.
 */
export function useRealtimeMessages(
  conversationId: string | null,
  onNewMessage: (message: ChatMessage) => void
) {
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!supabase || !conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Record<string, unknown>;
          onNewMessageRef.current({
            id: msg.id as string,
            conversation_id: msg.conversation_id as string,
            sender_id: msg.sender_id as string,
            content: msg.content as string,
            encryption_iv: msg.encryption_iv as string | null,
            encryption_salt: msg.encryption_salt as string | null,
            message_type: msg.message_type as string,
            created_at: msg.created_at as string,
            read_at: msg.read_at as string | null,
            delivered_at: msg.delivered_at as string | null,
            decrypted_content: undefined, // Will be decrypted by the component
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

/**
 * Search users to start a new conversation.
 */
export function useSearchUsers(query: string, currentUserId: string | null) {
  return useQuery({
    queryKey: ['searchUsers', query, currentUserId],
    queryFn: async () => {
      if (!supabase || !currentUserId || query.length < 2) return [];

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUserId)
        .single();

      if (!currentUser) return [];

      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, username, headline')
        .neq('id', currentUser.id)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .eq('account_status', 'active')
        .is('deleted_at', null)
        .limit(10);

      return users || [];
    },
    enabled: !!currentUserId && query.length >= 2,
  });
}
