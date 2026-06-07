import type { AgentDefinition, AgentContext, AgentResult } from './types.js';
export declare function runAgent(agent: AgentDefinition, query: string, context: AgentContext): Promise<AgentResult>;
export declare function runAgentStream(agent: AgentDefinition, query: string, context: AgentContext, onChunk: (chunk: string) => void): Promise<void>;
//# sourceMappingURL=agent-runner.d.ts.map