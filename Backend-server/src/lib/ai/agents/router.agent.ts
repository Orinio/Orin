import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

/**
 * Router Agent — lightweight intent classifier.
 * Uses a fast nano model to classify user intent and route to the right specialist.
 * Cost: ~$0.001 per classification (nano model, short output).
 */
export const routerAgent: AgentDefinition = {
  id: 'router',
  name: 'Router Agent',
  description: 'Classifies user intent and routes to the correct specialist agent',
  role: 'router',
  model: MODELS.fast.nano, // nvidia/llama-3.1-nemotron-nano-8b-v1 — cheapest, fastest
  temperature: 0.1, // Low temperature for deterministic classification
  maxTokens: 100,
  maxIterations: 1,
  timeoutMs: 10000, // 10s timeout — should be instant
  tools: [],
  systemPrompt: `You are an intent classifier. Your ONLY job is to classify the user's message into ONE of these categories:

- coaching: Career advice, mentoring, guidance about career decisions, resume help, interview prep, job search strategy
- skills: Skill extraction, skill analysis, skill gap analysis, what technologies to learn, skill assessment
- opportunities: Job matching, internship search, scholarship search, finding openings, application deadlines
- learning: Learning paths, course recommendations, study plans, tutorials, certifications to pursue
- portfolio: Portfolio scoring, proof card analysis, profile review, GitHub analysis, portfolio improvement
- verification: Verifying certificates, checking GitHub repos, validating LinkedIn profiles, confirming credentials
- general: General chat, greetings, questions that don't fit other categories

Respond with ONLY a JSON object:
{"category": "<category>", "confidence": <0.0-1.0>}

No other text. Just the JSON.`,
  outputFormat: 'json',
};
