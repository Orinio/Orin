'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversations, useMessages, useSendMessage } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';

function ConversationList({ conversations, activeId, onSelect }: { conversations: any[]; activeId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-1">
      {conversations.length === 0 && (
        <div className="text-center py-8">
          <span className="text-3xl">💬</span>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            No conversations yet
          </p>
          <Link href="/dashboard/network" className="text-xs mt-1 inline-block" style={{ color: 'var(--color-bloom)' }}>
            Find people to message →
          </Link>
        </div>
      )}
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
          style={{
            backgroundColor: activeId === conv.id ? 'var(--color-bloom)08' : 'transparent',
            border: activeId === conv.id ? '1px solid var(--color-bloom)20' : '1px solid transparent',
          }}
        >
          {conv.other_user?.avatar_url ? (
            <img src={conv.other_user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
              {(conv.other_user?.full_name || conv.other_user?.username)?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                {conv.other_user?.full_name || conv.other_user?.username}
              </span>
              {conv.last_message && (
                <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                  {formatRelativeTime(conv.last_message.created_at)}
                </span>
              )}
            </div>
            {conv.last_message && (
              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {conv.last_message.content}
              </p>
            )}
          </div>
          {conv.unread_count > 0 && (
            <span className="h-5 min-w-[20px] rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1.5 shrink-0" style={{ backgroundColor: 'var(--color-pulse)' }}>
              {conv.unread_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ChatView({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ conversationId, senderId: currentUserId, content: text.trim() });
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-2">
                <div className="h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="h-10 w-48 rounded-xl" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    backgroundColor: isMe ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                    color: isMe ? 'white' : 'var(--color-ink)',
                    borderBottomRightRadius: isMe ? '4px' : undefined,
                    borderBottomLeftRadius: !isMe ? '4px' : undefined,
                  }}
                >
                  <p>{msg.content}</p>
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : ''}`} style={!isMe ? { color: 'var(--color-text-tertiary)' } : {}}>
                    {formatRelativeTime(new Date(msg.created_at))}
                    {isMe && msg.read_at && ' · ✓✓'}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Start the conversation!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user: authUser } = useAuth();
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
          Messages
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Direct conversations with your network.
        </p>
      </div>

      {/* Chat layout */}
      <div className="card-premium overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Sidebar - Conversation list */}
          <div className="w-full sm:w-80 border-r shrink-0 overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
            <div className="p-3">
              <Link
                href="/dashboard/network"
                className="flex items-center justify-center gap-2 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-white mb-2"
                style={{ backgroundColor: 'var(--color-bloom)' }}
              >
                + New message
              </Link>
            </div>
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
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
                onSelect={setActiveConversation}
              />
            )}
          </div>

          {/* Main - Chat view */}
          <div className="hidden sm:flex flex-1 flex-col">
            {activeConversation ? (
              <ChatView conversationId={activeConversation} currentUserId={currentDbUser?.id || ''} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-5xl">💬</span>
                  <h3 className="text-lg font-semibold mt-3" style={{ color: 'var(--color-ink)' }}>
                    Select a conversation
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Choose from your existing conversations or start a new one.
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
