import type { AgentDefinition } from '../core/types.js';
import { verificationAgent } from './verification.agent.js';
import { coachAgent } from './coach.agent.js';
import { chatAgent } from './chat.agent.js';
import { skillAnalysisAgent } from './skill-analysis.agent.js';
import { opportunityMatcherAgent } from './opportunity-matcher.agent.js';
import { learningPathAgent } from './learning-path.agent.js';
import { portfolioScorerAgent } from './portfolio-scorer.agent.js';
import { safetyGuardAgent } from './safety-guard.agent.js';
import { routerAgent } from './router.agent.js';

const agentRegistry = new Map<string, AgentDefinition>();

const allAgents: AgentDefinition[] = [
  routerAgent,
  verificationAgent,
  coachAgent,
  chatAgent,
  skillAnalysisAgent,
  opportunityMatcherAgent,
  learningPathAgent,
  portfolioScorerAgent,
  safetyGuardAgent,
];

for (const agent of allAgents) {
  agentRegistry.set(agent.id, agent);
}

export function getAgent(id: string): AgentDefinition | undefined {
  return agentRegistry.get(id);
}

export function getAllAgents(): AgentDefinition[] {
  return Array.from(agentRegistry.values());
}

export function getAgentIds(): string[] {
  return Array.from(agentRegistry.keys());
}

export {
  routerAgent,
  verificationAgent,
  coachAgent,
  chatAgent,
  skillAnalysisAgent,
  opportunityMatcherAgent,
  learningPathAgent,
  portfolioScorerAgent,
  safetyGuardAgent,
};
