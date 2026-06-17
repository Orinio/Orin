'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Lock } from 'lucide-react';
import ConversationList from '@/components/chat/ConversationList';
import MessageThread from '@/components/chat/MessageThread';
import { useAuth } from '@/lib/auth-context';
import { useConversations, type Conversation } from '@/lib/chat';

export default function ChatPage() {
  const { user: authUser } = useAuth();
  const { data: conversations } = useConversations(authUser?.id ?? null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Get the selected conversation details
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  // Get the other participant's info for the selected conversation
  const otherParticipant = selectedConversation?.participants.find(
    p => p.user_id !== authUser?.id
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Conversation List */}
      <div
        className={cn(
          'w-full lg:w-80 border-r flex-shrink-0',
          selectedConversationId ? 'hidden lg:flex' : 'flex'
        )}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="w-full">
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
          />
        </div>
      </div>

      {/* Message Thread */}
      <div
        className={cn(
          'flex-1 min-w-0',
          selectedConversationId ? 'flex' : 'hidden lg:flex'
        )}
      >
        {selectedConversation && otherParticipant ? (
          <div className="w-full">
            <MessageThread
              conversationId={selectedConversation.id}
              otherUserPublicKey={otherParticipant.public_key}
              otherUserName={otherParticipant.full_name || otherParticipant.username || 'Unknown'}
              otherUserAvatar={otherParticipant.avatar_url}
              onBack={() => setSelectedConversationId(null)}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-bloom)12' }}
        >
          <MessageSquare className="h-12 w-12" style={{ color: 'var(--color-bloom)' }} />
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
          Secure Messaging
        </h2>
        <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
          Select a conversation or start a new one. All messages are end-to-end encrypted.
        </p>

        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl mx-auto max-w-xs" style={{ backgroundColor: 'var(--color-bloom)08' }}>
          <Lock className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-bloom)' }}>
            Your messages are private and secure
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
