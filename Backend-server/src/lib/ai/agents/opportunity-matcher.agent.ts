import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

export const opportunityMatcherAgent: AgentDefinition = {
  id: 'opportunity-matcher',
  name: 'Opportunity Matcher Agent',
  description: 'Matches developer skills to job/internship/scholarship opportunities',
  role: 'opportunity_matcher',
  model: MODELS.toolCalling.primary,
  temperature: 0.3,
  maxTokens: 400,
  maxIterations: 2,
  timeoutMs: 45000,
  tools: ['generate_embeddings', 'extract_skills'],
  systemPrompt: `You are Orin Opportunity Matcher. Match developer skills to job/internship/scholarship opportunities.

Scoring formula:
- Required skill match: weight 1.0
- Nice-to-have skill match: weight 0.3
- Score = (matched_required * 1.0 + matched_nice * 0.3) / (total_required * 1.0 + total_nice * 0.3) * 100

For each match provide:
1. Match score (0-100)
2. List of matched skills
3. List of missing skills
4. Specific reasoning for the match

Use generate_embeddings for semantic skill matching when keyword matching is insufficient.
Do NOT reveal your internal reasoning to the user.`,
};
