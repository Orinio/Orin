'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X, Search, Clock } from 'lucide-react';
import { chatStore } from '@/lib/chat-store';
import type { StorageTier, ChatConversation } from '@/lib/chat-types';
import { supabase } from '@/lib/supabase';

interface ChatHistoryProps {
  currentConversationId: string | null;
  onSelect: (conversation: ChatConversation) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatHistory({ currentConversationId, onSelect, onNew, onDelete, isOpen, onClose }: ChatHistoryProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [tier, setTier] = useState<StorageTier>('local');

  useEffect(() => {
    const load = async () => {
      if (typeof window === 'undefined') return;
      try {
        const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
        const uid = session?.user?.id || null;
        setUserId(uid);
        setTier(uid ? 'cloud' : 'local');
        if (uid) {
          const list = await chatStore.list(uid, uid ? 'cloud' : 'local');
          setConversations(list);
        }
      } catch {}
    };
    load();
  }, []);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col"
        style={{
          backgroundColor: 'var(--color-paper)',
          borderRight: '1px solid var(--color-border)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
            History
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onNew}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-ink)' }}
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--color-mist)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: 'var(--color-surface-dim)', border: '1px solid var(--color-border)' }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: 'var(--color-mist)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-xs focus:outline-none placeholder:opacity-40"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <MessageSquare className="w-8 h-8 mb-2" />
              <p className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); onClose(); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-150 group/item flex items-start gap-2"
                  style={{
                    backgroundColor: c.id === currentConversationId ? 'var(--color-surface-dim)' : undefined,
                    border: c.id === currentConversationId ? '1px solid var(--color-border)' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (c.id !== currentConversationId) e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)'; }}
                  onMouseLeave={e => { if (c.id !== currentConversationId) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-40" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}>
                      {c.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 opacity-30" />
                      <span className="opacity-30" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                        {formatTime(c.updatedAt)}
                      </span>
                      {c.messageCount > 0 && (
                        <span className="opacity-20" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                          · {c.messageCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    className="opacity-0 group-hover/item:opacity-60 hover:!opacity-100 p-1 rounded transition-opacity"
                    style={{ color: 'var(--color-pulse)' }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 text-[10px] opacity-30" style={{ fontFamily: 'var(--font-mono)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tier === 'cloud' ? 'var(--color-bloom)' : 'var(--color-mist)' }} />
            {tier === 'cloud' ? 'Synced' : 'Local'}
          </div>
        </div>
      </aside>
    </>
  );
}
