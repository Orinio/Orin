'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Shield,
  Lock,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useConversations, useCreateConversation, useSearchUsers, type Conversation } from '@/lib/chat';
import { useAuth } from '@/lib/auth-context';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { user: authUser } = useAuth();
  const { data: conversations, isLoading } = useConversations(authUser?.id ?? null);
  const createConversation = useCreateConversation(authUser?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: searchResults } = useSearchUsers(searchQuery, authUser?.id ?? null);

  const handleStartConversation = async (userId: string) => {
    try {
      const conversationId = await createConversation.mutateAsync(userId);
      onSelect(conversationId);
      setShowSearch(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
            Messages
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* E2E Encryption Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-bloom)08' }}>
          <Lock className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-bloom)' }}>
            End-to-end encrypted
          </span>
        </div>
      </div>

      {/* New Conversation Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                <input
                  type="text"
                  placeholder="Search users to message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-ink)',
                  }}
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchResults && searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-black/5 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: 'var(--color-bloom)' }}
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(user.full_name || 'U')
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                          {user.full_name || user.username}
                        </p>
                        {user.headline && (
                          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                            {user.headline}
                          </p>
                        )}
                      </div>
                      <MessageSquare className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
                <p className="mt-2 text-sm text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                  No users found
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onClick={() => onSelect(conv.id)}
                currentUserId={authUser?.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-bloom)12' }}
            >
              <MessageSquare className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <p className="text-sm font-medium text-center" style={{ color: 'var(--color-ink)' }}>
              No conversations yet
            </p>
            <p className="text-xs text-center mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Start a new conversation by clicking the + button
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
  currentUserId,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId?: string;
}) {
  const otherParticipant = conversation.participants.find(
    p => p.user_id !== currentUserId
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-4 transition-colors text-left',
        isSelected ? 'bg-black/5' : 'hover:bg-black/3'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        >
          {otherParticipant?.avatar_url ? (
            <img
              src={otherParticipant.avatar_url}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(conversation.name || 'U')
          )}
        </div>
        {/* Online indicator */}
        <div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: 'var(--color-bloom)',
            borderColor: 'var(--color-surface)',
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
            {conversation.name || 'Unknown'}
          </p>
          {conversation.last_message_at && (
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatRelativeTime(new Date(conversation.last_message_at))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Lock className="h-3 w-3 shrink-0" style={{ color: 'var(--color-bloom)' }} />
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
            {conversation.last_message_preview || 'No messages yet'}
          </p>
        </div>
      </div>

      {/* Unread Badge */}
      {conversation.unread_count > 0 && (
        <div
          className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        >
          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
        </div>
      )}
    </button>
  );
}
