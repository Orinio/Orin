import { supabase } from './supabase';
import { api } from './api-client';
import type { ChatConversation, ChatMessage, StorageTier } from './chat-types';

const STORAGE_KEY_PREFIX = 'orin.chat.v1.';
const STORAGE_INDEX_KEY = 'orin.chat.index.v1';

interface LocalIndex {
  userId: string;
  conversationIds: string[];
  updatedAt: string;
}

function readLocal<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      window.localStorage.removeItem(STORAGE_KEY_PREFIX + '_oldest');
    }
  }
}

function removeLocal(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function conversationKey(id: string) {
  return STORAGE_KEY_PREFIX + id;
}

function indexKey(userId: string) {
  return `${STORAGE_INDEX_KEY}.${userId}`;
}

export function getStorageTier(plan: string | null | undefined): StorageTier {
  return plan === 'pro' || plan === 'team' ? 'cloud' : 'local';
}

export const chatStore = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!readLocal<{ id: string }>('sb-orin-auth-user') || !!readLocal<{ id: string }>('sb-auth-user');
  },

  async list(userId: string, tier: StorageTier): Promise<ChatConversation[]> {
    if (tier === 'cloud' && userId && supabase) {
      try {
        const conversations = await api.chat.list();
        return conversations;
      } catch {
        return this.listFromLocal(userId);
      }
    }
    return this.listFromLocal(userId);
  },

  listFromLocal(userId: string): ChatConversation[] {
    const index = readLocal<LocalIndex>(indexKey(userId));
    if (!index) return [];
    return index.conversationIds
      .map(id => readLocal<ChatConversation>(conversationKey(id)))
      .filter((c): c is ChatConversation => !!c)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id: string, userId: string, tier: StorageTier): Promise<ChatConversation | null> {
    if (tier === 'cloud' && userId) {
      try {
        const c = await api.chat.get(id);
        if (c) {
          writeLocal(conversationKey(c.id), c);
          return c;
        }
      } catch {}
    }
    return readLocal<ChatConversation>(conversationKey(id));
  },

  async save(
    conversation: ChatConversation,
    tier: StorageTier,
  ): Promise<ChatConversation> {
    conversation.updatedAt = new Date().toISOString();
    conversation.messageCount = conversation.messages.length;
    writeLocal(conversationKey(conversation.id), conversation);

    const idx = readLocal<LocalIndex>(indexKey(conversation.userId || 'anon')) || {
      userId: conversation.userId || 'anon',
      conversationIds: [],
      updatedAt: new Date().toISOString(),
    };
    if (!idx.conversationIds.includes(conversation.id)) {
      idx.conversationIds.unshift(conversation.id);
    } else {
      idx.conversationIds = [
        conversation.id,
        ...idx.conversationIds.filter(id => id !== conversation.id),
      ];
    }
    idx.updatedAt = new Date().toISOString();
    writeLocal(indexKey(conversation.userId || 'anon'), idx);

    if (tier === 'cloud' && conversation.userId) {
      try {
        await api.chat.save(conversation);
      } catch {}
    }

    return conversation;
  },

  async remove(id: string, userId: string, tier: StorageTier): Promise<void> {
    removeLocal(conversationKey(id));
    const idx = readLocal<LocalIndex>(indexKey(userId));
    if (idx) {
      idx.conversationIds = idx.conversationIds.filter(cid => cid !== id);
      writeLocal(indexKey(userId), idx);
    }
    if (tier === 'cloud' && userId) {
      try {
        await api.chat.remove(id);
      } catch {}
    }
  },

  async clearAll(userId: string): Promise<void> {
    const idx = readLocal<LocalIndex>(indexKey(userId));
    if (idx) {
      idx.conversationIds.forEach(id => removeLocal(conversationKey(id)));
      removeLocal(indexKey(userId));
    }
  },

  generateTitle(firstMessage: string): string {
    const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 40) return cleaned || 'New conversation';
    return cleaned.slice(0, 40).trim() + '…';
  },

  newConversation(userId: string | null, agentId: string): ChatConversation {
    return {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      agentId,
      title: 'New conversation',
      messages: [],
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storage: userId ? 'cloud' : 'local',
    };
  },

  appendMessage(
    conversation: ChatConversation,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ): ChatMessage {
    const full: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(full);
    if (conversation.title === 'New conversation' && message.role === 'user') {
      conversation.title = this.generateTitle(message.content);
    }
    return full;
  },
};
