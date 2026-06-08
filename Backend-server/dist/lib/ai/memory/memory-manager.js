"use strict";
/**
 * Orin AI - Memory System
 * Persistent memory for AI agents with pgvector semantic search
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
exports.createMemoryManager = createMemoryManager;
const supabase_js_1 = require("../../supabase.js");
const logger_js_1 = require("../../logger.js");
const embedding_service_js_1 = require("../services/embedding.service.js");
const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// ============================================================
// Memory Manager
// ============================================================
class MemoryManager {
    userId;
    contextCache = null;
    constructor(userId) {
        this.userId = userId;
    }
    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    async embedText(text) {
        try {
            const result = await (0, embedding_service_js_1.generateEmbedding)(text);
            return result.embedding;
        }
        catch (error) {
            logger_js_1.logger.warn({ error }, 'Failed to generate embedding, falling back to keyword search');
            return null;
        }
    }
    // ------------------------------------------------------------
    // Conversation Memory
    // ------------------------------------------------------------
    async saveConversation(agentId, messages) {
        try {
            const { data: existing } = await supabase_js_1.supabase
                .from('chat_conversations')
                .select('id')
                .eq('user_id', this.userId)
                .eq('agent_id', agentId)
                .limit(1)
                .maybeSingle();
            const now = new Date().toISOString();
            const title = messages[0]?.content?.substring(0, 40) || 'New conversation';
            // Generate embedding from conversation content
            const contentForEmbedding = messages.slice(-5).map(m => m.content).join(' ');
            const embedding = await this.embedText(contentForEmbedding);
            if (existing) {
                const updateData = {
                    messages: messages.map(m => ({ ...m, timestamp: now })),
                    updated_at: now
                };
                if (embedding)
                    updateData.embedding = `[${embedding.join(',')}]`;
                const { error } = await supabase_js_1.supabase
                    .from('chat_conversations')
                    .update(updateData)
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const insertData = {
                    user_id: this.userId,
                    agent_id: agentId,
                    title,
                    messages: messages.map(m => ({ ...m, timestamp: now })),
                    message_count: messages.length,
                };
                if (embedding)
                    insertData.embedding = `[${embedding.join(',')}]`;
                const { error } = await supabase_js_1.supabase
                    .from('chat_conversations')
                    .insert(insertData);
                if (error)
                    throw error;
            }
            // Invalidate context cache
            this.contextCache = null;
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save conversation');
        }
    }
    async getConversation(agentId) {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('chat_conversations')
                .select('*')
                .eq('user_id', this.userId)
                .eq('agent_id', agentId)
                .limit(1)
                .maybeSingle();
            if (error || !data)
                return null;
            return {
                sessionId: data.agent_id,
                messages: data.messages || [],
                topics: []
            };
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get conversation');
            return null;
        }
    }
    async getRecentConversations(limit = 5) {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('chat_conversations')
                .select('*')
                .eq('user_id', this.userId)
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return (data || []).map(d => ({
                sessionId: d.agent_id,
                messages: d.messages || [],
                topics: []
            }));
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get recent conversations');
            return [];
        }
    }
    // ------------------------------------------------------------
    // User Preferences Memory
    // ------------------------------------------------------------
    async savePreferences(preferences) {
        try {
            const updateData = {
                user_id: this.userId,
                updated_at: new Date().toISOString()
            };
            if (preferences.learningStyle)
                updateData.learning_style = preferences.learningStyle;
            if (preferences.communicationTone)
                updateData.communication_tone = preferences.communicationTone;
            if (preferences.interests)
                updateData.interests = preferences.interests;
            if (preferences.goals)
                updateData.career_goals = preferences.goals;
            // Generate embedding from preferences text
            const textParts = [];
            if (preferences.learningStyle)
                textParts.push(`learning style: ${preferences.learningStyle}`);
            if (preferences.communicationTone)
                textParts.push(`communication: ${preferences.communicationTone}`);
            if (preferences.interests?.length)
                textParts.push(`interests: ${preferences.interests.join(', ')}`);
            if (preferences.goals?.length)
                textParts.push(`goals: ${preferences.goals.join(', ')}`);
            if (textParts.length > 0) {
                const embedding = await this.embedText(textParts.join('. '));
                if (embedding)
                    updateData.embedding = `[${embedding.join(',')}]`;
            }
            const { error } = await supabase_js_1.supabase
                .from('ai_user_preferences')
                .upsert(updateData, { onConflict: 'user_id' });
            if (error)
                throw error;
            this.contextCache = null;
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save preferences');
        }
    }
    async getPreferences() {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('ai_user_preferences')
                .select('*')
                .eq('user_id', this.userId)
                .single();
            if (error || !data)
                return null;
            return {
                userId: data.user_id,
                learningStyle: data.learning_style || 'hands-on',
                communicationTone: data.communication_tone || 'casual',
                interests: data.interests || [],
                goals: data.career_goals || [],
                preferredResources: []
            };
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get preferences');
            return null;
        }
    }
    // ------------------------------------------------------------
    // Skill Memory
    // ------------------------------------------------------------
    async saveSkill(skill, level, source) {
        try {
            const { data: existing } = await supabase_js_1.supabase
                .from('ai_skill_memory')
                .select('id')
                .eq('user_id', this.userId)
                .eq('skill', skill.toLowerCase())
                .limit(1)
                .maybeSingle();
            const confidence = level === 'expert' ? 1.0 : level === 'advanced' ? 0.8 : level === 'intermediate' ? 0.5 : 0.3;
            const embedding = await this.embedText(`${skill} ${level} ${source || ''}`);
            if (existing) {
                const updateData = {
                    level,
                    confidence,
                    source,
                    last_assessed: new Date().toISOString()
                };
                if (embedding)
                    updateData.embedding = `[${embedding.join(',')}]`;
                const { error } = await supabase_js_1.supabase
                    .from('ai_skill_memory')
                    .update(updateData)
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const insertData = {
                    user_id: this.userId,
                    skill: skill.toLowerCase(),
                    level,
                    confidence,
                    source,
                    last_assessed: new Date().toISOString()
                };
                if (embedding)
                    insertData.embedding = `[${embedding.join(',')}]`;
                const { error } = await supabase_js_1.supabase
                    .from('ai_skill_memory')
                    .insert(insertData);
                if (error)
                    throw error;
            }
            this.contextCache = null;
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save skill');
        }
    }
    async getSkills() {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('ai_skill_memory')
                .select('skill, level, source')
                .eq('user_id', this.userId);
            if (error)
                throw error;
            return (data || []).map(d => ({
                skill: d.skill,
                level: d.level,
                source: d.source
            }));
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get skills');
            return [];
        }
    }
    // ------------------------------------------------------------
    // Learning Memory
    // ------------------------------------------------------------
    async saveLearningProgress(skill, progress, notes) {
        try {
            const { data: existing } = await supabase_js_1.supabase
                .from('ai_learning_progress')
                .select('id')
                .eq('user_id', this.userId)
                .eq('skill', skill)
                .limit(1)
                .maybeSingle();
            if (existing) {
                const { error } = await supabase_js_1.supabase
                    .from('ai_learning_progress')
                    .update({
                    progress,
                    last_activity: new Date().toISOString()
                })
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase_js_1.supabase
                    .from('ai_learning_progress')
                    .insert({
                    user_id: this.userId,
                    skill,
                    progress,
                    milestones: notes ? [{ note: notes, timestamp: new Date().toISOString() }] : []
                });
                if (error)
                    throw error;
            }
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save learning progress');
        }
    }
    async getLearningProgress() {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('ai_learning_progress')
                .select('*')
                .eq('user_id', this.userId);
            if (error)
                throw error;
            return (data || []).map(d => ({
                skill: d.skill,
                progress: d.progress,
                notes: d.milestones?.[0]?.note || undefined
            }));
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get learning progress');
            return [];
        }
    }
    // ------------------------------------------------------------
    // Goal Memory (upsert to prevent duplicates)
    // ------------------------------------------------------------
    async saveGoal(goal, deadline, status = 'pending') {
        try {
            const { error } = await supabase_js_1.supabase
                .from('ai_goals')
                .upsert({
                user_id: this.userId,
                goal,
                deadline,
                status,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,goal' });
            if (error)
                throw error;
            this.contextCache = null;
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save goal');
        }
    }
    async getGoals(status) {
        try {
            let query = supabase_js_1.supabase
                .from('ai_goals')
                .select('*')
                .eq('user_id', this.userId);
            if (status) {
                query = query.eq('status', status);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error)
                throw error;
            return (data || []).map(d => ({
                goal: d.goal,
                deadline: d.deadline,
                status: d.status
            }));
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get goals');
            return [];
        }
    }
    // ------------------------------------------------------------
    // Fact Memory (upsert to prevent duplicates, with embeddings)
    // ------------------------------------------------------------
    async saveFact(fact, importance = 5, metadata) {
        try {
            const embedding = await this.embedText(fact);
            const insertData = {
                user_id: this.userId,
                fact,
                importance,
                metadata,
                created_at: new Date().toISOString()
            };
            if (embedding)
                insertData.embedding = `[${embedding.join(',')}]`;
            const { error } = await supabase_js_1.supabase
                .from('ai_facts')
                .upsert(insertData, { onConflict: 'user_id,fact' });
            if (error)
                throw error;
            this.contextCache = null;
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save fact');
        }
    }
    async getImportantFacts(limit = 10) {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('ai_facts')
                .select('*')
                .eq('user_id', this.userId)
                .order('importance', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return (data || []).map(d => ({
                fact: d.fact,
                importance: d.importance,
                metadata: d.metadata
            }));
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to get facts');
            return [];
        }
    }
    // ------------------------------------------------------------
    // Semantic Memory Search (pgvector cosine similarity)
    // ------------------------------------------------------------
    async searchMemories(query, limit = 5) {
        try {
            // Try vector search first
            const queryEmbedding = await this.embedText(query);
            if (queryEmbedding) {
                const { data, error } = await supabase_js_1.supabase.rpc('search_memories_semantic', {
                    query_embedding: `[${queryEmbedding.join(',')}]`,
                    user_id_param: this.userId,
                    similarity_threshold: 0.2,
                    max_results: limit
                });
                if (!error && data && data.length > 0) {
                    return data.map((row) => ({
                        id: row.id,
                        userId: this.userId,
                        type: row.memory_type,
                        content: row.content,
                        similarity: row.similarity,
                        metadata: row.metadata,
                        importance: 5,
                        createdAt: '',
                        updatedAt: ''
                    }));
                }
            }
            // Fallback to keyword search if vector search fails or returns nothing
            return this.searchMemoriesKeyword(query, limit);
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to search memories');
            return this.searchMemoriesKeyword(query, limit);
        }
    }
    async searchMemoriesKeyword(query, limit) {
        const [conversations, skills, goals, facts] = await Promise.all([
            this.getRecentConversations(3),
            this.getSkills(),
            this.getGoals(),
            this.getImportantFacts(5)
        ]);
        const memories = [];
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
        const queryLower = query.toLowerCase();
        const scored = memories.map(m => ({
            ...m,
            relevance: m.content.toLowerCase().includes(queryLower) ? 10 :
                m.content.toLowerCase().split(' ').filter(w => queryLower.includes(w)).length
        }));
        return scored
            .sort((a, b) => (b.relevance * b.importance) - (a.relevance * a.importance))
            .slice(0, limit);
    }
    // ------------------------------------------------------------
    // Build Context for AI Agent (with caching)
    // ------------------------------------------------------------
    async buildAgentContext() {
        // Check cache
        if (this.contextCache && Date.now() < this.contextCache.expiresAt) {
            return this.contextCache.context;
        }
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
        // Cache the result
        this.contextCache = {
            context,
            expiresAt: Date.now() + CONTEXT_CACHE_TTL_MS
        };
        return context;
    }
}
exports.MemoryManager = MemoryManager;
// ============================================================
// Factory function
// ============================================================
function createMemoryManager(userId) {
    return new MemoryManager(userId);
}
exports.default = {
    MemoryManager,
    createMemoryManager
};
//# sourceMappingURL=memory-manager.js.map