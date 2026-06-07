'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Cloud,
  HardDrive,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePlan } from '@/lib/plan-context';
import { chatStore } from '@/lib/chat-store';
import type { ChatConversation } from '@/lib/chat-types';

interface ChatHistorySidebarProps {
  activeId: string | null;
  onSelect: (conversation: ChatConversation) => void;
  onNew: () => void;
  refreshKey?: number;
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}

export function ChatHistorySidebar({
  activeId,
  onSelect,
  onNew,
  refreshKey,
}: ChatHistorySidebarProps) {
  const { user } = useAuth();
  const { tier, isFree, planDef } = usePlan();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const userId = user?.id || 'anon';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await chatStore.list(userId, tier);
      setConversations(list);
    } finally {
      setLoading(false);
    }
  }, [userId, tier]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await chatStore.remove(id, userId, tier);
      setConversations(prev => prev.filter(c => c.id !== id));
    },
    [userId, tier],
  );

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );

  const chatLimit = planDef.storage.chatHistoryLimit;
  const isAtLimit = chatLimit !== 'unlimited' && conversations.length >= chatLimit;

  return (
    <aside className="w-full sm:w-72 lg:w-80 flex-shrink-0 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full">
      <div className="px-4 py-3.5 border-b border-[var(--color-border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)15' }}>
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Chats</h3>
              <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {isFree ? (
                  <>
                    <HardDrive className="w-2.5 h-2.5" />
                    Saved on this device
                  </>
                ) : (
                  <>
                    <Cloud className="w-2.5 h-2.5" />
                    Synced to cloud
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNew}
          disabled={isAtLimit}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isAtLimit ? 'var(--color-surface-dim)' : 'var(--color-ink)',
            color: isAtLimit ? 'var(--color-text-tertiary)' : 'var(--color-paper)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New conversation
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search chats…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-[var(--radius-md)] focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-surface-dim)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-ink)',
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Loading conversations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-10 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-ink)' }}>
              {query ? 'No matches' : 'Start your first chat'}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
              {query
                ? 'Try a different search term.'
                : isFree
                ? 'Free chats are saved on this device only.'
                : 'Your chats sync across all devices.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(c => {
              const isActive = c.id === activeId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="group relative rounded-[var(--radius-md)] transition-all duration-150 cursor-pointer"
                  style={{
                    backgroundColor: isActive ? 'var(--color-bloom)12' : 'transparent',
                    border: isActive ? '1px solid var(--color-bloom)30' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold truncate flex-1" style={{ color: 'var(--color-ink)' }}>
                        {c.title}
                      </p>
                      <button
                        onClick={e => handleDelete(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" style={{ color: 'var(--color-text-tertiary)' }} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                      <span>{formatRelative(c.updatedAt)}</span>
                      <span>·</span>
                      <span>{c.messageCount} msg{c.messageCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isFree && (
        <div className="px-4 py-3 border-t border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
            <Cloud className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            Want cloud sync?
          </p>
          <p className="text-[10px] leading-relaxed mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Pro syncs chats across all devices and unlocks cloud storage connectors.
          </p>
          <a
            href="/pricing"
            className="block w-full text-center text-[11px] font-semibold py-1.5 rounded-[var(--radius-sm)] transition-colors"
            style={{
              backgroundColor: 'var(--color-ink)',
              color: 'var(--color-paper)',
            }}
          >
            Upgrade
          </a>
        </div>
      )}
    </aside>
  );
}
