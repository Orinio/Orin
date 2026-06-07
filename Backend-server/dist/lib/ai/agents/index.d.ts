import type { AgentDefinition } from '../core/types.js';
import { verificationAgent } from './verification.agent.js';
import { coachAgent } from './coach.agent.js';
import { chatAgent } from './chat.agent.js';
import { skillAnalysisAgent } from './skill-analysis.agent.js';
import { opportunityMatcherAgent } from './opportunity-matcher.agent.js';
import { learningPathAgent } from './learning-path.agent.js';
import { portfolioScorerAgent } from './portfolio-scorer.agent.js';
import { safetyGuardAgent } from './safety-guard.agent.js';
export declare function getAgent(id: string): AgentDefinition | undefined;
export declare function getAllAgents(): AgentDefinition[];
export declare function getAgentIds(): string[];
export { verificationAgent, coachAgent, chatAgent, skillAnalysisAgent, opportunityMatcherAgent, learningPathAgent, portfolioScorerAgent, safetyGuardAgent, };
//# sourceMappingURL=index.d.ts.map