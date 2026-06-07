"use strict";
/**
 * Orin AI - Memory System
 * Persistent memory for AI agents across conversations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
exports.createMemoryManager = createMemoryManager;
const supabase_js_1 = require("../../supabase.js");
const logger_js_1 = require("../../logger.js");
// ============================================================
// Memory Manager
// ============================================================
class MemoryManager {
    userId;
    constructor(userId) {
        this.userId = userId;
    }
    // ------------------------------------------------------------
    // Conversation Memory
    // ------------------------------------------------------------
    async saveConversation(agentId, messages) {
        try {
            // Find existing conversation for this user+agent, or insert new
            const { data: existing } = await supabase_js_1.supabase
                .from('ai_conversations')
                .select('id')
                .eq('user_id', this.userId)
                .eq('agent_id', agentId)
                .limit(1)
                .maybeSingle();
            const now = new Date().toISOString();
            if (existing) {
                const { error } = await supabase_js_1.supabase
                    .from('ai_conversations')
                    .update({
                    messages: messages.map(m => ({ ...m, timestamp: now })),
                    updated_at: now
                })
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase_js_1.supabase
                    .from('ai_conversations')
                    .insert({
                    user_id: this.userId,
                    agent_id: agentId,
                    messages: messages.map(m => ({ ...m, timestamp: now })),
                    metadata: {},
                });
                if (error)
                    throw error;
            }
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save conversation');
        }
    }
    async getConversation(agentId) {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('ai_conversations')
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
                .from('ai_conversations')
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
            // Map our interface fields to actual DB columns
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
            const { error } = await supabase_js_1.supabase
                .from('ai_user_preferences')
                .upsert(updateData, { onConflict: 'user_id' });
            if (error)
                throw error;
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
            // Find existing skill memory or insert new
            const { data: existing } = await supabase_js_1.supabase
                .from('ai_skill_memory')
                .select('id')
                .eq('user_id', this.userId)
                .eq('skill', skill.toLowerCase())
                .limit(1)
                .maybeSingle();
            const confidence = level === 'expert' ? 1.0 : level === 'advanced' ? 0.8 : level === 'intermediate' ? 0.5 : 0.3;
            if (existing) {
                const { error } = await supabase_js_1.supabase
                    .from('ai_skill_memory')
                    .update({
                    level,
                    confidence,
                    source,
                    last_assessed: new Date().toISOString()
                })
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase_js_1.supabase
                    .from('ai_skill_memory')
                    .insert({
                    user_id: this.userId,
                    skill: skill.toLowerCase(),
                    level,
                    confidence,
                    source,
                    last_assessed: new Date().toISOString()
                });
                if (error)
                    throw error;
            }
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to save skill');
        }
    }
    async getSkills() {
        try {
            const { data, error } = await supabase_js_1.supabase
                .from('ai_skill_memory')
                .select('*')
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
            // Find existing learning progress or insert new
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
    // Goal Memory
    // ------------------------------------------------------------
    async saveGoal(goal, deadline, status = 'pending') {
        try {
            const { error } = await supabase_js_1.supabase
                .from('ai_goals')
                .insert({
                user_id: this.userId,
                goal,
                deadline,
                status,
                created_at: new Date().toISOString()
            });
            if (error)
                throw error;
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
    // Fact Memory (Important facts to remember)
    // ------------------------------------------------------------
    async saveFact(fact, importance = 5, metadata) {
        try {
            const { error } = await supabase_js_1.supabase
                .from('ai_facts')
                .insert({
                user_id: this.userId,
                fact,
                importance,
                metadata,
                created_at: new Date().toISOString()
            });
            if (error)
                throw error;
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
    // Memory Search (Find relevant memories for context)
    // ------------------------------------------------------------
    async searchMemories(query, limit = 5) {
        try {
            // Search across different memory types
            const [conversations, skills, goals, facts] = await Promise.all([
                this.getRecentConversations(3),
                this.getSkills(),
                this.getGoals(),
                this.getImportantFacts(5)
            ]);
            const memories = [];
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
        }
        catch (error) {
            logger_js_1.logger.error({ error, userId: this.userId }, 'Failed to search memories');
            return [];
        }
    }
    // ------------------------------------------------------------
    // Build Context for AI Agent
    // ------------------------------------------------------------
    async buildAgentContext() {
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