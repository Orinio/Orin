import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

/**
 * Router Agent — ultra-fast intent classifier.
 * Uses nano model to classify in 2-4s, then delegates to specialist.
 */
export const routerAgent: AgentDefinition = {
  id: 'router',
  name: 'Router',
  description: 'Classifies user intent and routes to the correct specialist agent',
  role: 'router',
  model: MODELS.fast.nano,
  temperature: 0.1,
  maxTokens: 20,
  maxIterations: 1,
  timeoutMs: 5000,
  tools: [],
  systemPrompt: `Classify the user message into ONE category. Reply with ONLY the category name:

- chat: Simple questions, greetings, quick tips, explanations
- career: Portfolio analysis, skills, opportunities, job matching
- verification: GitHub repos, certificates, LinkedIn, Kaggle
- visual: Charts, diagrams, dashboards, visualizations
- action: Save goals, track applications, generate resume bullets

Category:`,
};
