/**
 * Orin AI - Memory System
 * Persistent memory for AI agents across conversations
 */

import { supabase } from '../../supabase.js';
import { logger } from '../../logger.js';

// ============================================================
// Memory Types
// ============================================================
export interface MemoryEntry {
  id: string;
  userId: string;
  type: 'conversation' | 'preference' | 'skill' | 'learning' | 'goal' | 'fact';
  content: string;
  metadata?: Record<string, any>;
  importance: number; // 1-10
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMemory {
  sessionId: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  summary?: string;
  topics: string[];
}

export interface UserPreferences {
  userId: string;
  learningStyle: 'visual' | 'text' | 'hands-on';
  communicationTone: 'formal' | 'casual' | 'technical';
  interests: string[];
  goals: string[];
  preferredResources: string[];
}

// ============================================================
// Memory Manager
// ============================================================
export class MemoryManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ------------------------------------------------------------
  // Conversation Memory
  // ------------------------------------------------------------
  
  async saveConversation(sessionId: string, messages: Array<{ role: string; content: string }>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .upsert({
          user_id: this.userId,
          session_id: sessionId,
          messages: messages.map(m => ({ ...m, timestamp: new Date().toISOString() })),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,session_id' });

      if (error) throw error;
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to save conversation');
    }
  }

  async getConversation(sessionId: string): Promise<ConversationMemory | null> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('session_id', sessionId)
        .single();

      if (error || !data) return null;

      return {
        sessionId: data.session_id,
        messages: data.messages || [],
        summary: data.summary,
        topics: data.topics || []
      };
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get conversation');
      return null;
    }
  }

  async getRecentConversations(limit: number = 5): Promise<ConversationMemory[]> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(d => ({
        sessionId: d.session_id,
        messages: d.messages || [],
        summary: d.summary,
        topics: d.topics || []
      }));
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get recent conversations');
      return [];
    }
  }

  // ------------------------------------------------------------
  // User Preferences Memory
  // ------------------------------------------------------------

  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_user_preferences')
        .upsert({
          user_id: this.userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to save preferences');
    }
  }

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('ai_user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error || !data) return null;

      return {
        userId: data.user_id,
        learningStyle: data.learning_style || 'hands-on',
        communicationTone: data.communication_tone || 'casual',
        interests: data.interests || [],
        goals: data.goals || [],
        preferredResources: data.preferred_resources || []
      };
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get preferences');
      return null;
    }
  }

  // ------------------------------------------------------------
  // Skill Memory
  // ------------------------------------------------------------

  async saveSkill(skill: string, level: 'beginner' | 'intermediate' | 'advanced' | 'expert', source?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_skill_memory')
        .upsert({
          user_id: this.userId,
          skill: skill.toLowerCase(),
          level,
          source,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,skill' });

      if (error) throw error;
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to save skill');
    }
  }

  async getSkills(): Promise<Array<{ skill: string; level: string; source?: string }>> {
    try {
      const { data, error } = await supabase
        .from('ai_skill_memory')
        .select('*')
        .eq('user_id', this.userId);

      if (error) throw error;

      return (data || []).map(d => ({
        skill: d.skill,
        level: d.level,
        source: d.source
      }));
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get skills');
      return [];
    }
  }

  // ------------------------------------------------------------
  // Learning Memory
  // ------------------------------------------------------------

  async saveLearningProgress(skill: string, progress: number, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_learning_progress')
        .upsert({
          user_id: this.userId,
          skill,
          progress,
          notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,skill' });

      if (error) throw error;
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to save learning progress');
    }
  }

  async getLearningProgress(): Promise<Array<{ skill: string; progress: number; notes?: string }>> {
    try {
      const { data, error } = await supabase
        .from('ai_learning_progress')
        .select('*')
        .eq('user_id', this.userId);

      if (error) throw error;

      return (data || []).map(d => ({
        skill: d.skill,
        progress: d.progress,
        notes: d.notes
      }));
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get learning progress');
      return [];
    }
  }

  // ------------------------------------------------------------
  // Goal Memory
  // ------------------------------------------------------------

  async saveGoal(goal: string, deadline?: string, status: 'pending' | 'in_progress' | 'completed' = 'pending'): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_goals')
        .insert({
          user_id: this.userId,
          goal,
          deadline,
          status,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to save goal');
    }
  }

  async getGoals(status?: string): Promise<Array<{ goal: string; deadline?: string; status: string }>> {
    try {
      let query = supabase
        .from('ai_goals')
        .select('*')
        .eq('user_id', this.userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(d => ({
        goal: d.goal,
        deadline: d.deadline,
        status: d.status
      }));
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get goals');
      return [];
    }
  }

  // ------------------------------------------------------------
  // Fact Memory (Important facts to remember)
  // ------------------------------------------------------------

  async saveFact(fact: string, importance: number = 5, metadata?: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_facts')
        .insert({
          user_id: this.userId,
          fact,
          importance,
          metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to save fact');
    }
  }

  async getImportantFacts(limit: number = 10): Promise<Array<{ fact: string; importance: number; metadata?: any }>> {
    try {
      const { data, error } = await supabase
        .from('ai_facts')
        .select('*')
        .eq('user_id', this.userId)
        .order('importance', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(d => ({
        fact: d.fact,
        importance: d.importance,
        metadata: d.metadata
      }));
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to get facts');
      return [];
    }
  }

  // ------------------------------------------------------------
  // Memory Search (Find relevant memories for context)
  // ------------------------------------------------------------

  async searchMemories(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    try {
      // Search across different memory types
      const [conversations, skills, goals, facts] = await Promise.all([
        this.getRecentConversations(3),
        this.getSkills(),
        this.getGoals(),
        this.getImportantFacts(5)
      ]);

      const memories: MemoryEntry[] = [];

      // Convert conversations to memories
      for (const conv of conversations) {
        const lastMessages = conv.messages.slice(-5);
        memories.push({
          id: `conv-${conv.sessionId}`,
          userId: this.userId,
          type: 'conversation',
          content: lastMessages.map(m => `${m.role}: ${m.content}`).join('\n'),
          importance: 5,
          createdAt: '',
          updatedAt: ''
        });
      }

      // Convert skills to memories
      for (const skill of skills) {
        memories.push({
          id: `skill-${skill.skill}`,
          userId: this.userId,
          type: 'skill',
          content: `${skill.skill} (${skill.level})`,
          importance: skill.level === 'expert' ? 9 : skill.level === 'advanced' ? 7 : 5,
          createdAt: '',
          updatedAt: ''
        });
      }

      // Convert goals to memories
      for (const goal of goals) {
        memories.push({
          id: `goal-${goal.goal}`,
          userId: this.userId,
          type: 'goal',
          content: goal.goal,
          importance: goal.status === 'completed' ? 8 : 6,
          createdAt: '',
          updatedAt: ''
        });
      }

      // Convert facts to memories
      for (const fact of facts) {
        memories.push({
          id: `fact-${fact.fact.substring(0, 20)}`,
          userId: this.userId,
          type: 'fact',
          content: fact.fact,
          importance: fact.importance,
          metadata: fact.metadata,
          createdAt: '',
          updatedAt: ''
        });
      }

      // Simple relevance scoring (in production, use vector search)
      const queryLower = query.toLowerCase();
      const scored = memories.map(m => ({
        ...m,
        relevance: m.content.toLowerCase().includes(queryLower) ? 10 : 
                   m.content.toLowerCase().split(' ').filter(w => queryLower.includes(w)).length
      }));

      // Sort by relevance * importance and return top results
      return scored
        .sort((a, b) => (b.relevance * b.importance) - (a.relevance * a.importance))
        .slice(0, limit);
    } catch (error) {
      logger.error({ error, userId: this.userId }, 'Failed to search memories');
      return [];
    }
  }

  // ------------------------------------------------------------
  // Build Context for AI Agent
  // ------------------------------------------------------------

  async buildAgentContext(): Promise<string> {
    const [preferences, skills, goals, recentFacts] = await Promise.all([
      this.getPreferences(),
      this.getSkills(),
      this.getGoals('in_progress'),
      this.getImportantFacts(5)
    ]);

    let context = 'User Context:\n';

    if (preferences) {
      context += `- Learning style: ${preferences.learningStyle}\n`;
      context += `- Communication tone: ${preferences.communicationTone}\n`;
      if (preferences.interests.length > 0) {
        context += `- Interests: ${preferences.interests.join(', ')}\n`;
      }
      if (preferences.goals.length > 0) {
        context += `- Goals: ${preferences.goals.join(', ')}\n`;
      }
    }

    if (skills.length > 0) {
      context += `- Known skills: ${skills.map(s => `${s.skill} (${s.level})`).join(', ')}\n`;
    }

    if (goals.length > 0) {
      context += `- Active goals: ${goals.map(g => g.goal).join(', ')}\n`;
    }

    if (recentFacts.length > 0) {
      context += `- Important facts: ${recentFacts.map(f => f.fact).join('; ')}\n`;
    }

    return context;
  }
}

// ============================================================
// Factory function
// ============================================================
export function createMemoryManager(userId: string): MemoryManager {
  return new MemoryManager(userId);
}

export default {
  MemoryManager,
  createMemoryManager
};
