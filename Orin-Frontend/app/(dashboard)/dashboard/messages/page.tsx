'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations, useMessages, useSendMessage } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';
import { Search, MoreHorizontal, Phone, Video, Info, Send, Smile, ArrowLeft, Circle } from 'lucide-react';

function ConversationList({ conversations, activeId, onSelect, searchQuery, onSearchChange }: {
  conversations: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = c.other_user?.full_name || c.other_user?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl bg-[var(--color-surface-dim)] pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 transition-all"
            style={{ color: 'var(--color-ink)' }}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
              <Send className="w-7 h-7" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>No conversations yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Start a conversation from a user&apos;s profile
            </p>
            <Link
              href="/dashboard/network"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
            >
              Find people
            </Link>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeId === conv.id;
            const hasUnread = conv.unread_count > 0;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 border-b border-[var(--color-border)]/50"
                style={{
                  backgroundColor: isActive ? 'var(--color-bloom)08' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-bloom)' : '3px solid transparent',
                }}
              >
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  {conv.other_user?.avatar_url ? (
                    <img src={conv.other_user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
                      {(conv.other_user?.full_name || conv.other_user?.username)?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--color-bloom)' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                      {conv.other_user?.full_name || conv.other_user?.username}
                    </span>
                    {conv.last_message && (
                      <span className="text-[10px] shrink-0 ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                        {formatRelativeTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {conv.last_message ? (
                      <p className={`text-xs truncate ${hasUnread ? 'font-semibold' : ''}`} style={{ color: hasUnread ? 'var(--color-ink)' : 'var(--color-text-tertiary)' }}>
                        {conv.last_message.sender_id === conv.other_user?.id ? '' : 'You: '}{conv.last_message.content}
                      </p>
                    ) : (
                      <p className="text-xs italic" style={{ color: 'var(--color-text-tertiary)' }}>No messages yet</p>
                    )}
                    {hasUnread && (
                      <span className="shrink-0 ml-2 h-5 min-w-[20px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1.5" style={{ backgroundColor: 'var(--color-pulse)' }}>
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChatView({ conversationId, currentUserId, otherUser, onBack }: {
  conversationId: string;
  currentUserId: string;
  otherUser: any;
  onBack: () => void;
}) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ conversationId, senderId: currentUserId, content: text.trim() });
    setText('');
  };

  const groupedMessages = (messages || []).reduce((groups: any[], msg: any, i: number) => {
    const prev = messages?.[i - 1];
    const sameSender = prev?.sender_id === msg.sender_id;
    const sameDay = prev && new Date(prev.created_at).toDateString() === new Date(msg.created_at).toDateString();

    if (sameSender && sameDay) {
      groups[groups.length - 1].messages.push(msg);
    } else {
      groups.push({ sender_id: msg.sender_id, date: msg.created_at, messages: [msg] });
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onBack}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[var(--color-surface-dim)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-ink)' }} />
        </button>
        {otherUser?.avatar_url ? (
          <img src={otherUser.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
            {(otherUser?.full_name || otherUser?.username)?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/p/${otherUser?.username}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-ink)' }}>
            {otherUser?.full_name || otherUser?.username}
          </Link>
          <div className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-[var(--color-bloom)]" style={{ color: 'var(--color-bloom)' }} />
            <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Online</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl hover:bg-[var(--color-surface-dim)] transition-colors">
            <Phone className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
          <button className="p-2 rounded-xl hover:bg-[var(--color-surface-dim)] transition-colors">
            <Video className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
          <button className="p-2 rounded-xl hover:bg-[var(--color-surface-dim)] transition-colors">
            <Info className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-10 w-48 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          groupedMessages.map((group: any, gi: number) => {
            const isMe = group.sender_id === currentUserId;
            return (
              <div key={gi} className="space-y-0.5">
                {group.messages.map((msg: any, mi: number) => {
                  const isFirst = mi === 0;
                  const isLast = mi === group.messages.length - 1;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2, delay: gi * 0.02 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[75%] px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: isMe ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                          color: isMe ? 'white' : 'var(--color-ink)',
                          borderRadius: isMe
                            ? `${isFirst ? '18px' : '18px'} ${isLast ? '4px' : '18px'} ${isFirst ? '18px' : '18px'} 18px`
                            : `${isFirst ? '18px' : '18px'} 18px ${isLast ? '4px' : '18px'} ${isFirst ? '18px' : '18px'}`,
                        }}
                      >
                        <p>{msg.content}</p>
                      </div>
                    </motion.div>
                  );
                })}
                {/* Timestamp for group */}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-2`}>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    {formatRelativeTime(group.messages[group.messages.length - 1].created_at)}
                    {isMe && group.messages[group.messages.length - 1].read_at && ' · Read'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)10' }}>
                <Send className="w-7 h-7" style={{ color: 'var(--color-bloom)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Start the conversation</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Send a message to {otherUser?.full_name || otherUser?.username}
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-[var(--color-surface-dim)] transition-colors">
            <Smile className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-[var(--color-surface-dim)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 transition-all"
            style={{ color: 'var(--color-ink)' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="p-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40"
            style={{
              background: text.trim() ? 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)' : 'var(--color-surface-dim)',
              color: text.trim() ? 'white' : 'var(--color-text-tertiary)',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user: authUser } = useAuth();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const { data: currentDbUser } = useQuery({
    queryKey: ['current-db-user', authUser?.id],
    queryFn: async () => {
      if (!supabase || !authUser?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      return data;
    },
    enabled: !!authUser?.id,
  });

  const { data: conversations, isLoading } = useConversations(currentDbUser?.id || null);

  const activeConv = conversations?.find((c: any) => c.id === activeConversation);
  const otherUser = activeConv?.other_user;

  const handleSelect = useCallback((id: string) => {
    setActiveConversation(id);
    setMobileShowChat(true);
  }, []);

  const handleBack = useCallback(() => {
    setMobileShowChat(false);
    setActiveConversation(null);
  }, []);

  return (
    <div className="h-[calc(100vh-80px)]">
      <div className="card-premium overflow-hidden h-full flex flex-col">
        <div className="flex h-full">
          {/* Sidebar - Conversation list */}
          <div className={`${mobileShowChat ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-80 border-r shrink-0`} style={{ borderColor: 'var(--color-border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                Messages
              </h2>
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-12 w-12 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                      <div className="h-2 w-32 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ConversationList
                conversations={conversations || []}
                activeId={activeConversation}
                onSelect={handleSelect}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
          </div>

          {/* Main - Chat view */}
          <div className={`${!mobileShowChat ? 'hidden' : 'flex'} lg:flex flex-1 flex-col`}>
            {activeConversation && otherUser ? (
              <ChatView
                conversationId={activeConversation}
                currentUserId={currentDbUser?.id || ''}
                otherUser={otherUser}
                onBack={handleBack}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)10' }}>
                    <Send className="w-9 h-9" style={{ color: 'var(--color-bloom)' }} />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                    Select a conversation
                  </h3>
                  <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                    Choose from your existing conversations or start a new one from someone&apos;s profile.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
