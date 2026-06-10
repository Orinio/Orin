export interface Tool {
    name: string;
    description: string;
    category: 'verification' | 'search' | 'analysis' | 'safety' | 'data' | 'learning' | 'career' | 'code' | 'web' | 'memory';
    timeoutMs?: number;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
        }>;
        required: string[];
    };
    execute: (args: Record<string, any>, context?: ToolContext) => Promise<ToolResult>;
}
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
}
export interface ToolContext {
    userId?: string;
    sessionId?: string;
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
}
export interface ToolCall {
    name: string;
    arguments: Record<string, any>;
}
export interface AgentDefinition {
    id: string;
    name: string;
    description: string;
    role: string;
    model: string;
    temperature: number;
    maxTokens: number;
    maxIterations: number;
    timeoutMs: number;
    tools: string[];
    systemPrompt: string;
}
export interface AgentContext {
    userId: string;
    userProfile: any;
    proofs: any[];
    skillAnalysis?: any;
    opportunities?: any[];
    conversationHistory?: Array<{
        role: string;
        content: string;
    }>;
    metadata?: Record<string, any>;
}
export interface AgentResult {
    agentId: string;
    answer: string;
    thinking: string;
    toolCalls: Array<{
        tool: string;
        args: any;
        result: ToolResult;
    }>;
    iterations: number;
    totalTokens: number;
    model: string;
    durationMs: number;
    visualSpecs?: Array<Record<string, any>>;
}
export interface AgentConfig {
    model?: string;
    maxIterations?: number;
    temperature?: number;
    maxTokens?: number;
}
//# sourceMappingURL=types.d.ts.map