import { supabase } from './supabase';

export interface AIMemoryEntry {
  id: string;
  userId: string;
  category: 'preference' | 'goal' | 'skill' | 'context' | 'fact';
  key: string;
  value: string;
  confidence: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMemoryStore {
  get(category: string, key?: string): Promise<AIMemoryEntry[]>;
  set(entry: Omit<AIMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>;
  delete(id: string): Promise<void>;
  getAll(): Promise<AIMemoryEntry[]>;
  buildContext(): Promise<string>;
}

/**
 * AI Memory Store — persists user context across conversations.
 *
 * Categories:
 * - preference: User preferences (e.g., "prefers TypeScript over JavaScript")
 * - goal: Career goals (e.g., "wants to become a senior engineer")
 * - skill: Skills and proficiency levels (e.g., "advanced Python")
 * - context: Conversation context (e.g., "is working on a React project")
 * - fact: Verified facts (e.g., "has 3 years of experience")
 */
class SupabaseMemoryStore implements AIMemoryStore {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async get(category: AIMemoryEntry['category'], key?: string): Promise<AIMemoryEntry[]> {
    if (!supabase) return [];

    let query = supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', this.userId)
      .eq('category', category)
      .order('updated_at', { ascending: false });

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to read AI memory:', error);
      return [];
    }

    return (data || []).map(this.mapEntry);
  }

  async set(entry: Omit<AIMemoryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('ai_memory')
      .upsert(
        {
          user_id: this.userId,
          category: entry.category,
          key: entry.key,
          value: entry.value,
          confidence: entry.confidence,
          source: entry.source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category,key' }
      );

    if (error) {
      console.warn('Failed to write AI memory:', error);
    }
  }

  async delete(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('ai_memory')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      console.warn('Failed to delete AI memory:', error);
    }
  }

  async getAll(): Promise<AIMemoryEntry[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('ai_memory')
      .select('*')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Failed to read AI memory:', error);
      return [];
    }

    return (data || []).map(this.mapEntry);
  }

  /**
   * Build a context string from stored memory for AI prompts.
   */
  async buildContext(): Promise<string> {
    const all = await this.getAll();
    if (all.length === 0) return '';

    const sections: string[] = [];

    // Group by category
    const byCategory = new Map<string, AIMemoryEntry[]>();
    all.forEach((e) => {
      const existing = byCategory.get(e.category) || [];
      existing.push(e);
      byCategory.set(e.category, existing);
    });

    // Preferences
    const prefs = byCategory.get('preference');
    if (prefs?.length) {
      sections.push(`User preferences: ${prefs.map((p) => p.value).join('; ')}`);
    }

    // Goals
    const goals = byCategory.get('goal');
    if (goals?.length) {
      sections.push(`Career goals: ${goals.map((g) => g.value).join('; ')}`);
    }

    // Skills
    const skills = byCategory.get('skill');
    if (skills?.length) {
      sections.push(`Skills: ${skills.map((s) => `${s.key} (${s.value})`).join(', ')}`);
    }

    // Facts
    const facts = byCategory.get('fact');
    if (facts?.length) {
      sections.push(`About the user: ${facts.map((f) => f.value).join('; ')}`);
    }

    // Recent context
    const context = byCategory.get('context');
    if (context?.length) {
      const recent = context.slice(0, 3);
      sections.push(`Recent context: ${recent.map((c) => c.value).join('; ')}`);
    }

    return sections.join('\n');
  }

  private mapEntry(row: Record<string, unknown>): AIMemoryEntry {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      category: row.category as AIMemoryEntry['category'],
      key: row.key as string,
      value: row.value as string,
      confidence: (row.confidence as number) || 1,
      source: (row.source as string) || 'user',
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

/**
 * Auto-extract memory from conversation messages.
 */
export function extractMemoryFromMessage(
  message: string,
  existingMemory: AIMemoryEntry[]
): Array<Omit<AIMemoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
  const entries: Array<Omit<AIMemoryEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = [];
  const lower = message.toLowerCase();

  // Detect goals
  const goalPatterns = [
    { pattern: /i want to (?:become|get|learn|improve|start)/i, extract: (m: string) => m.replace(/.*i want to /i, '').slice(0, 100) },
    { pattern: /my goal is/i, extract: (m: string) => m.replace(/.*my goal is /i, '').slice(0, 100) },
    { pattern: /i'?m (?:trying|working) to/i, extract: (m: string) => m.replace(/.*i'?m (?:trying|working) to /i, '').slice(0, 100) },
  ];

  for (const { pattern, extract } of goalPatterns) {
    const match = message.match(pattern);
    if (match) {
      const value = extract(message);
      if (value.length > 5) {
        entries.push({
          category: 'goal',
          key: 'active_goal',
          value,
          confidence: 0.8,
          source: 'conversation',
        });
      }
    }
  }

  // Detect skills mentioned
  const skillKeywords = [
    'react', 'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'c++',
    'node.js', 'vue', 'angular', 'swift', 'kotlin', 'sql', 'aws', 'docker',
    'kubernetes', 'machine learning', 'data science', 'frontend', 'backend',
    'full stack', 'devops', 'ui/ux', 'figma', 'design',
  ];

  for (const skill of skillKeywords) {
    if (lower.includes(skill)) {
      const exists = existingMemory.some(
        (e) => e.category === 'skill' && e.key === skill
      );
      if (!exists) {
        entries.push({
          category: 'skill',
          key: skill,
          value: 'mentioned',
          confidence: 0.6,
          source: 'conversation',
        });
      }
    }
  }

  // Detect experience level
  const expPatterns = [
    { pattern: /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i, key: 'years_experience' },
    { pattern: /i(?:'m| am) (?:a|an) (?:senior|junior|mid|staff|principal|lead)/i, key: 'seniority' },
  ];

  for (const { pattern, key } of expPatterns) {
    const match = message.match(pattern);
    if (match) {
      entries.push({
        category: 'fact',
        key,
        value: match[0],
        confidence: 0.9,
        source: 'conversation',
      });
    }
  }

  // Detect preferences
  const prefPatterns = [
    { pattern: /i (?:prefer|like|love|enjoy) (.+?)(?:\.|,|$)/i, key: 'preference' },
    { pattern: /i (?:don'?t like|hate|dislike) (.+?)(?:\.|,|$)/i, key: 'dislike' },
  ];

  for (const { pattern, key } of prefPatterns) {
    const match = message.match(pattern);
    if (match) {
      entries.push({
        category: 'preference',
        key,
        value: match[1].trim().slice(0, 100),
        confidence: 0.7,
        source: 'conversation',
      });
    }
  }

  return entries;
}

/**
 * Create a memory store for a user.
 */
export function createMemoryStore(userId: string): AIMemoryStore {
  return new SupabaseMemoryStore(userId);
}
