import type { AgentContext } from './ai/core/types.js';
export declare function buildAgentContext(authUserId: string): Promise<AgentContext>;
/**
 * Invalidate cached context for a user (call after mutations).
 */
export declare function invalidateContextCache(authUserId: string): void;
//# sourceMappingURL=context.d.ts.map