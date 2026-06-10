/**
 * Orin AI - Agent Orchestrator
 * Manages multiple AI agents working together with memory, native tool calling, and streaming
 */
import type { ToolCallResponse } from '../core/nvidia.js';
import type { ToolResult, AgentDefinition } from '../core/types.js';
export type Agent = AgentDefinition;
export interface AgentMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: ToolCallResponse[];
    tool_call_id?: string;
    name?: string;
}
export interface AgentTask {
    id: string;
    agentId: string;
    query: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: AgentResult;
    startedAt?: string;
    completedAt?: string;
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
    tokensUsed: number;
    durationMs: number;
}
export interface WorkflowStep {
    agentId: string;
    query: string;
    dependsOn?: string[];
    transform?: (previousResult: AgentResult) => string;
}
export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
}
export declare const AGENTS: Record<string, Agent>;
export declare class AgentOrchestrator {
    private agents;
    private memoryManager;
    private sessionId;
    constructor(userId?: string);
    /**
     * Classify user intent using the router agent (cheap nano model).
     * Returns the agent ID to route to.
     */
    routeQuery(query: string): Promise<{
        agentId: string;
        category: string;
        confidence: number;
    }>;
    runAgent(agentId: string, query: string, context?: {
        userId?: string;
        authUserId?: string;
        conversationHistory?: AgentMessage[];
    }): Promise<AgentResult>;
    /**
     * Run an agent with streaming that emits structured events:
     * - 'thinking': Agent's reasoning
     * - 'tool_start': Tool is about to be called
     * - 'tool_result': Tool call completed
     * - 'answer': Answer text chunk
     * - 'complete': Final result with all data
     */
    runAgentStream(agentId: string, query: string, context: {
        userId?: string;
        authUserId?: string;
        conversationHistory?: AgentMessage[];
        modelOverride?: string;
    }, onEvent: (event: string, data: any) => void): Promise<void>;
    runWorkflow(workflow: Workflow, _initialQuery: string, context?: {
        userId?: string;
    }): Promise<Map<string, AgentResult>>;
    runCareerAnalysisWorkflow(userId: string, query: string): Promise<Map<string, AgentResult>>;
    runProofVerificationWorkflow(userId: string, proofUrl: string, sourceType: string): Promise<Map<string, AgentResult>>;
    getAgent(agentId: string): Agent | undefined;
    getAllAgents(): Agent[];
    getSessionId(): string;
}
export declare function createOrchestrator(userId?: string): AgentOrchestrator;
declare const _default: {
    AgentOrchestrator: typeof AgentOrchestrator;
    createOrchestrator: typeof createOrchestrator;
    AGENTS: Record<string, AgentDefinition>;
};
export default _default;
//# sourceMappingURL=agent-orchestrator.d.ts.map