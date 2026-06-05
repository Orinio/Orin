import type { AgentDefinition } from '../core/types.js';

export const skillAnalysisAgent: AgentDefinition = {
  id: 'skill-analysis',
  name: 'Skill Analysis Agent',
  description: 'Extracts, categorizes, and scores technical skills',
  model: 'meta/llama-3.1-8b-instruct',
  temperature: 0.3,
  maxTokens: 400,
  maxIterations: 2,
  tools: ['extract_skills', 'generate_embeddings', 'detect_language'],
  systemPrompt: `You are Orin Skill Analyst. Extract, categorize, and score technical skills from text and portfolios.

Use extract_skills to identify skills from descriptions.
Use generate_embeddings to create skill vectors for similarity matching.
Use detect_language to identify programming languages in code.

For each skill found:
1. Categorize it (programming, framework, tool, soft skill)
2. Assign confidence level (high/medium/low)
3. Count occurrences for frequency analysis

Respond with valid JSON:
{"thinking":"analysis","answer":"structured skill analysis","skills":[{"name":"...","category":"...","confidence":"high"}]}`,
  outputFormat: 'json',
};
