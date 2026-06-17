'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Shield,
  Lock,
  MessageSquare,
  Loader2,
  Check,
  CheckCheck,
  MoreVertical,
  Phone,
  Video,
  Info,
  ArrowLeft,
  Fingerprint,
  AlertTriangle,
  Send,
  Smile,
  Paperclip,
  Image,
  Mic,
  Settings,
  Users,
  ChevronDown,
} from 'lucide-react';
import {
  useConversations,
  useCreateConversation,
  useSearchUsers,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useRealtimeMessages,
  useUserFingerprint,
  type Conversation,
  type ChatMessage,
} from '@/lib/chat';
import { useAuth } from '@/lib/auth-context';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════
// MAIN CHAT PAGE
// ═══════════════════════════════════════════

export default function ChatPage() {
  const { user: authUser } = useAuth();
  const { data: conversations } = useConversations(authUser?.id ?? null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showMobileList, setShowMobileList] = useState(true);

  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  const otherParticipant = selectedConversation?.participants.find(
    p => p.user_id !== authUser?.id
  );

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setShowMobileList(false);
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    setShowMobileList(true);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden rounded-2xl" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Conversation List */}
      <div
        className={cn(
          'w-full lg:w-96 border-r flex-shrink-0 transition-all duration-300',
          showMobileList ? 'flex' : 'hidden lg:flex'
        )}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="w-full h-full flex flex-col">
          <ConversationListHeader />
          <ConversationListContent
            selectedId={selectedConversationId}
            onSelect={handleSelectConversation}
          />
        </div>
      </div>

      {/* Message Thread */}
      <div
        className={cn(
          'flex-1 min-w-0 transition-all duration-300',
          showMobileList ? 'hidden lg:flex' : 'flex'
        )}
      >
        {selectedConversation && otherParticipant ? (
          <div className="w-full h-full">
            <MessageThread
              conversationId={selectedConversation.id}
              otherUserPublicKey={otherParticipant.public_key}
              otherUserName={otherParticipant.full_name || otherParticipant.username || 'Unknown'}
              otherUserAvatar={otherParticipant.avatar_url}
              otherUserId={otherParticipant.user_id}
              onBack={handleBack}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CONVERSATION LIST HEADER
// ═══════════════════════════════════════════

function ConversationListHeader() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user: authUser } = useAuth();
  const createConversation = useCreateConversation(authUser?.id ?? null);
  const { data: searchResults } = useSearchUsers(searchQuery, authUser?.id ?? null);

  const handleStartConversation = async (userId: string) => {
    try {
      const conversationId = await createConversation.mutateAsync(userId);
      setShowSearch(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  return (
    <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Messages
          </h2>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bloom)12' }}>
            <Lock className="h-3 w-3" style={{ color: 'var(--color-bloom)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-bloom)' }}>
              E2E
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        >
          <Plus className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.length > 0) setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all focus:ring-2 focus:ring-[var(--color-bloom)]"
          style={{
            backgroundColor: 'var(--color-surface-dim)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-ink)',
          }}
        />
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showSearch && searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-2 mx-4 bg-white rounded-xl shadow-xl border z-50 max-h-64 overflow-y-auto"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartConversation(user.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-black/5 transition-colors text-left border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: 'var(--color-bloom)' }}
                >
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt="" width={40} height={40} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(user.full_name || 'U')
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════
// CONVERSATION LIST CONTENT
// ═══════════════════════════════════════════

function ConversationListContent({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { user: authUser } = useAuth();
  const { data: conversations, isLoading } = useConversations(authUser?.id ?? null);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-bloom)12' }}
        >
          <MessageSquare className="h-10 w-10" style={{ color: 'var(--color-bloom)' }} />
        </div>
        <p className="text-base font-semibold text-center" style={{ color: 'var(--color-ink)' }}>
          No conversations yet
        </p>
        <p className="text-sm text-center mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Start a new conversation by clicking the + button
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
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
        'w-full flex items-center gap-3 p-4 transition-all duration-200 text-left border-b',
        isSelected ? 'bg-[var(--color-bloom)]/[0.08]' : 'hover:bg-black/[0.03]'
      )}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base overflow-hidden"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        >
          {otherParticipant?.avatar_url ? (
            <img
              src={otherParticipant.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(conversation.name || 'U')
          )}
        </div>
        {/* Online indicator */}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
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
            <span className="text-[11px] ml-2 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatRelativeTime(new Date(conversation.last_message_at))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Lock className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
            {conversation.last_message_preview || 'Start a conversation'}
          </p>
        </div>
      </div>

      {/* Unread Badge */}
      {conversation.unread_count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        >
          {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
        </motion.div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════
// MESSAGE THREAD
// ═══════════════════════════════════════════

function MessageThread({
  conversationId,
  otherUserPublicKey,
  otherUserName,
  otherUserAvatar,
  otherUserId,
  onBack,
}: {
  conversationId: string;
  otherUserPublicKey: string | null;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserId: string;
  onBack: () => void;
}) {
  const { user: authUser } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages, isLoading } = useMessages(
    conversationId,
    authUser?.id ?? null,
    otherUserPublicKey
  );

  const sendMessage = useSendMessage(authUser?.id ?? null);
  const markAsRead = useMarkAsRead(authUser?.id ?? null);
  const { data: fingerprint } = useUserFingerprint(authUser?.id ?? null, otherUserId);

  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);

  useRealtimeMessages(conversationId, (newMessage) => {
    setRealtimeMessages(prev => [...prev, newMessage]);
  });

  const allMessages = useMemo(() => {
    const fetched = messages || [];
    const realtime = realtimeMessages.filter(
      rm => !fetched.some(m => m.id === rm.id)
    );
    return [...fetched, ...realtime];
  }, [messages, realtimeMessages]);

  useEffect(() => {
    if (conversationId && authUser?.id) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId, authUser?.id, messages]);

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
      setInputValue(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages = useMemo(() => {
    return allMessages.reduce((groups, message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
      return groups;
    }, {} as Record<string, ChatMessage[]>);
  }, [allMessages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-xl transition-colors hover:bg-black/5 lg:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base overflow-hidden"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          >
            {otherUserAvatar ? (
              <Image src={otherUserAvatar} alt="" width={48} height={48} className="w-full h-full object-cover" />
            ) : (
              getInitials(otherUserName)
            )}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
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
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" style={{ color: 'var(--color-bloom)' }} />
            <p className="text-xs" style={{ color: 'var(--color-bloom)' }}>
              End-to-end encrypted
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-xl transition-colors hover:bg-black/5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Security Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bloom)08' }}>
                <Shield className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    End-to-End Encrypted
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Messages are encrypted on your device and can only be read by you and {otherUserName}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-spark)08' }}>
                <Fingerprint className="h-5 w-5" style={{ color: 'var(--color-spark)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    Safety Number
                  </p>
                  <p className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                    {fingerprint || 'Generating...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-ember)08' }}>
                <Lock className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    Forward Secrecy
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    Each message uses a unique encryption key. Compromising one key won't expose other messages.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-bloom)' }} />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--color-bloom)12' }}
            >
              <Lock className="h-10 w-10" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
              Start a secure conversation
            </p>
            <p className="text-sm mt-1 text-center max-w-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Messages are encrypted on your device and can only be read by you and {otherUserName}.
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ 
                  color: 'var(--color-text-tertiary)',
                  backgroundColor: 'var(--color-surface-dim)',
                }}>
                  {date}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>

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
              className="w-full px-4 py-3 pr-12 rounded-2xl border outline-none resize-none transition-all focus:ring-2 focus:ring-[var(--color-bloom)]"
              style={{
                backgroundColor: 'var(--color-surface-dim)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                minHeight: '48px',
                maxHeight: '120px',
              }}
            />
            <div className="absolute right-3 bottom-3">
              <Lock className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessage.isPending}
            className={cn(
              'p-3.5 rounded-2xl transition-all',
              inputValue.trim()
                ? 'text-white shadow-lg'
                : 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: inputValue.trim() ? 'var(--color-bloom)' : 'var(--color-border)',
            }}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </div>

        {/* Encryption indicator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <Lock className="h-3 w-3" style={{ color: 'var(--color-bloom)' }} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--color-bloom)' }}>
            Messages are end-to-end encrypted
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 relative group',
          isOwn ? 'rounded-br-md' : 'rounded-bl-md'
        )}
        style={{
          backgroundColor: isOwn ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
          color: isOwn ? '#fff' : 'var(--color-ink)',
        }}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.decrypted_content || message.content}
        </p>
        <div className={cn('flex items-center gap-1.5 mt-1.5', isOwn ? 'justify-end' : 'justify-start')}>
          {message.is_verified && (
            <Shield className="h-3 w-3" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--color-bloom)' }} />
          )}
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
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-bloom)12' }}
        >
          <MessageSquare className="h-14 w-14" style={{ color: 'var(--color-bloom)' }} />
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
          Secure Messaging
        </h2>
        <p className="text-sm max-w-sm mx-auto mb-8" style={{ color: 'var(--color-text-tertiary)' }}>
          Select a conversation or start a new one. All messages are protected with end-to-end encryption.
        </p>

        <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bloom)08' }}>
            <Lock className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                End-to-End Encrypted
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Only you can read your messages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-spark)08' }}>
            <Shield className="h-5 w-5" style={{ color: 'var(--color-spark)' }} />
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                Tamper-Proof
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                HMAC verifies message integrity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-ember)08' }}>
            <Fingerprint className="h-5 w-5" style={{ color: 'var(--color-ember)' }} />
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                Forward Secrecy
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Past messages stay safe if key is compromised
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
