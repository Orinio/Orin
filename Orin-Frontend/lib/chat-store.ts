import { supabase } from './supabase';
import { api } from './api-client';
import { idbGet, idbSet, idbDelete } from './idb';
import type { ChatConversation, ChatMessage, StorageTier } from './chat-types';

const CHAT_STORE = 'chat';
const LEGACY_PREFIX = 'orin.chat.v1.';
const LEGACY_INDEX_PREFIX = 'orin.chat.index.v1';
const MIGRATION_KEY = 'orin.chat.idb.migrated';

interface LocalIndex {
  userId: string;
  conversationIds: string[];
  updatedAt: string;
}

function conversationKey(id: string) {
  return `conv:${id}`;
}

function indexKey(userId: string) {
  return `index:${userId}`;
}

let migrationDone = false;

async function migrateFromLocalStorage() {
  if (migrationDone || typeof window === 'undefined') return;
  try {
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
    if (alreadyMigrated) {
      migrationDone = true;
      return;
    }

    const keys = Object.keys(localStorage).filter(
      k => k.startsWith(LEGACY_PREFIX) || k.startsWith(LEGACY_INDEX_PREFIX),
    );

    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const value = JSON.parse(raw);

      if (key.startsWith(LEGACY_INDEX_PREFIX)) {
        const userId = key.slice(LEGACY_INDEX_PREFIX.length + 1);
        await idbSet(CHAT_STORE, indexKey(userId), value);
      } else {
        const id = key.slice(LEGACY_PREFIX.length);
        await idbSet(CHAT_STORE, conversationKey(id), value);
      }
      localStorage.removeItem(key);
    }

    localStorage.setItem(MIGRATION_KEY, '1');
    migrationDone = true;
  } catch {
    migrationDone = true;
  }
}

export function getStorageTier(plan: string | null | undefined): StorageTier {
  return plan === 'pro' || plan === 'team' ? 'cloud' : 'local';
}

export const chatStore = {
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('sb-orin-auth-user') || localStorage.getItem('sb-auth-user');
      return !!raw;
    } catch {
      return false;
    }
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

  async listFromLocal(userId: string): Promise<ChatConversation[]> {
    await migrateFromLocalStorage();
    const index = await idbGet<LocalIndex>(CHAT_STORE, indexKey(userId));
    if (!index) return [];
    const conversations = await Promise.all(
      index.conversationIds.map(id => idbGet<ChatConversation>(CHAT_STORE, conversationKey(id))),
    );
    return conversations
      .filter((c): c is ChatConversation => !!c)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id: string, userId: string, tier: StorageTier): Promise<ChatConversation | null> {
    if (tier === 'cloud' && userId) {
      try {
        const c = await api.chat.get(id);
        if (c) {
          await idbSet(CHAT_STORE, conversationKey(c.id), c);
          return c;
        }
      } catch {}
    }
    await migrateFromLocalStorage();
    return idbGet<ChatConversation>(CHAT_STORE, conversationKey(id));
  },

  async save(
    conversation: ChatConversation,
    tier: StorageTier,
  ): Promise<ChatConversation> {
    await migrateFromLocalStorage();
    conversation.updatedAt = new Date().toISOString();
    conversation.messageCount = conversation.messages.length;
    await idbSet(CHAT_STORE, conversationKey(conversation.id), conversation);

    const userId = conversation.userId || 'anon';
    const idx = await idbGet<LocalIndex>(CHAT_STORE, indexKey(userId)) || {
      userId,
      conversationIds: [] as string[],
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
    await idbSet(CHAT_STORE, indexKey(userId), idx);

    if (tier === 'cloud' && conversation.userId) {
      try {
        await api.chat.save(conversation);
      } catch {}
    }

    return conversation;
  },

  async remove(id: string, userId: string, tier: StorageTier): Promise<void> {
    await migrateFromLocalStorage();
    await idbDelete(CHAT_STORE, conversationKey(id));
    const idx = await idbGet<LocalIndex>(CHAT_STORE, indexKey(userId));
    if (idx) {
      idx.conversationIds = idx.conversationIds.filter(cid => cid !== id);
      await idbSet(CHAT_STORE, indexKey(userId), idx);
    }
    if (tier === 'cloud' && userId) {
      try {
        await api.chat.remove(id);
      } catch {}
    }
  },

  async clearAll(userId: string): Promise<void> {
    await migrateFromLocalStorage();
    const idx = await idbGet<LocalIndex>(CHAT_STORE, indexKey(userId));
    if (idx) {
      await Promise.all(idx.conversationIds.map(id => idbDelete(CHAT_STORE, conversationKey(id))));
      await idbDelete(CHAT_STORE, indexKey(userId));
    }
  },

  generateTitle(firstMessage: string): string {
    const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 40) return cleaned || 'New conversation';
    return cleaned.slice(0, 40).trim() + '…';
  },

  newConversation(userId: string | null, agentId: string): ChatConversation {
    return {
      id: crypto.randomUUID(),
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
