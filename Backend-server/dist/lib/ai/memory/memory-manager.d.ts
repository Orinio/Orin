/**
 * Orin AI - Memory System
 * Persistent memory for AI agents across conversations
 */
export interface MemoryEntry {
    id: string;
    userId: string;
    type: 'conversation' | 'preference' | 'skill' | 'learning' | 'goal' | 'fact';
    content: string;
    metadata?: Record<string, any>;
    importance: number;
    createdAt: string;
    updatedAt: string;
}
export interface ConversationMemory {
    sessionId: string;
    messages: Array<{
        role: string;
        content: string;
        timestamp: string;
    }>;
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
export declare class MemoryManager {
    private userId;
    constructor(userId: string);
    saveConversation(agentId: string, messages: Array<{
        role: string;
        content: string;
    }>): Promise<void>;
    getConversation(agentId: string): Promise<ConversationMemory | null>;
    getRecentConversations(limit?: number): Promise<ConversationMemory[]>;
    savePreferences(preferences: Partial<UserPreferences>): Promise<void>;
    getPreferences(): Promise<UserPreferences | null>;
    saveSkill(skill: string, level: 'beginner' | 'intermediate' | 'advanced' | 'expert', source?: string): Promise<void>;
    getSkills(): Promise<Array<{
        skill: string;
        level: string;
        source?: string;
    }>>;
    saveLearningProgress(skill: string, progress: number, notes?: string): Promise<void>;
    getLearningProgress(): Promise<Array<{
        skill: string;
        progress: number;
        notes?: string;
    }>>;
    saveGoal(goal: string, deadline?: string, status?: 'pending' | 'in_progress' | 'completed'): Promise<void>;
    getGoals(status?: string): Promise<Array<{
        goal: string;
        deadline?: string;
        status: string;
    }>>;
    saveFact(fact: string, importance?: number, metadata?: Record<string, any>): Promise<void>;
    getImportantFacts(limit?: number): Promise<Array<{
        fact: string;
        importance: number;
        metadata?: any;
    }>>;
    searchMemories(query: string, limit?: number): Promise<MemoryEntry[]>;
    buildAgentContext(): Promise<string>;
}
export declare function createMemoryManager(userId: string): MemoryManager;
declare const _default: {
    MemoryManager: typeof MemoryManager;
    createMemoryManager: typeof createMemoryManager;
};
export default _default;
//# sourceMappingURL=memory-manager.d.ts.map