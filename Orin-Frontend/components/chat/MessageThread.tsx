'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Shield,
  ArrowLeft,
  Info,
  Loader2,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useRealtimeMessages,
  type ChatMessage,
} from '@/lib/chat';
import { useAuth } from '@/lib/auth-context';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  conversationId: string;
  otherUserPublicKey: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  onBack: () => void;
}

export default function MessageThread({
  conversationId,
  otherUserPublicKey,
  otherUserName,
  otherUserAvatar,
  onBack,
}: MessageThreadProps) {
  const { user: authUser } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages, isLoading } = useMessages(
    conversationId,
    authUser?.id ?? null,
    otherUserPublicKey
  );

  const sendMessage = useSendMessage(authUser?.id ?? null);
  const markAsRead = useMarkAsRead(authUser?.id ?? null);

  // Real-time messages
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);

  useRealtimeMessages(conversationId, (newMessage) => {
    setRealtimeMessages(prev => [...prev, newMessage]);
  });

  // Combine fetched and realtime messages
  const allMessages = [...(messages || []), ...realtimeMessages.filter(
    rm => !messages?.some(m => m.id === rm.id)
  )];

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId && authUser?.id) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId, authUser?.id, messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = async () => {
    if (!inputValue.trim() || !otherUserPublicKey) return;

    const message = inputValue.trim();
    setInputValue('');

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: message,
        recipientPublicKey: otherUserPublicKey,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputValue(message); // Restore on failure
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = allMessages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-lg transition-colors hover:bg-black/5 lg:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          >
            {otherUserAvatar ? (
              <Image src={otherUserAvatar} alt="" width={40} height={40} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(otherUserName)
            )}
          </div>
          <div
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{
              backgroundColor: 'var(--color-bloom)',
              borderColor: 'var(--color-surface)',
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
            {otherUserName}
          </p>
          <div className="flex items-center gap-1">
            <Lock className="h-3 w-3" style={{ color: 'var(--color-bloom)' }} />
            <p className="text-xs" style={{ color: 'var(--color-bloom)' }}>
              End-to-end encrypted
            </p>
          </div>
        </div>

        <button
          className="p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      {/* Encryption Notice */}
      <div className="px-4 py-3 text-center" style={{ backgroundColor: 'var(--color-bloom)04' }}>
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
          <p className="text-xs" style={{ color: 'var(--color-bloom)' }}>
            Messages are end-to-end encrypted. No one outside this chat can read them.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-bloom)12' }}
            >
              <Lock className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              Start a secure conversation
            </p>
            <p className="text-xs mt-1 text-center max-w-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Messages are encrypted on your device and can only be read by you and {otherUserName}.
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                  {date}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>

              {/* Messages */}
              <div className="space-y-2">
                {msgs.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === authUser?.id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 rounded-2xl border outline-none resize-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            <div className="absolute right-3 bottom-3">
              <Lock className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessage.isPending}
            className={cn(
              'p-3 rounded-full transition-all',
              inputValue.trim()
                ? 'text-white hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: inputValue.trim() ? 'var(--color-bloom)' : 'var(--color-border)',
            }}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isOwn ? 'rounded-br-md' : 'rounded-bl-md'
        )}
        style={{
          backgroundColor: isOwn ? 'var(--color-bloom)' : 'var(--color-surface)',
          color: isOwn ? '#fff' : 'var(--color-ink)',
        }}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.decrypted_content || message.content}
        </p>
        <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
          <span
            className="text-[10px]"
            style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--color-text-tertiary)' }}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwn && (
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
              {message.read_at ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
