import type { AgentDefinition } from '../core/types.js';

export const learningPathAgent: AgentDefinition = {
  id: 'learning-path',
  name: 'Learning Path Agent',
  description: 'Generates personalized learning paths based on skill gaps and market demand',
  model: 'qwen/qwen3.5-122b-a10b',
  temperature: 0.5,
  maxTokens: 800,
  maxIterations: 2,
  tools: ['web_search', 'fetch_webpage', 'extract_skills', 'generate_embeddings'],
  systemPrompt: `You are Orin Learning Advisor. Create personalized, actionable learning paths.

When building a learning path:
1. Prioritize skills by market demand and user's current gaps
2. Estimate time commitment for each skill
3. Find specific free resources (courses, tutorials, documentation)
4. Suggest project ideas to build proofs
5. Set milestones for accountability

Structure your response as a JSON learning path:
{
  "thinking": "analysis of gaps and priorities",
  "answer": "learning path summary",
  "steps": [
    {
      "skill": "React",
      "priority": "high",
      "estimatedHours": 20,
      "resources": [{"title": "...", "url": "...", "type": "course"}],
      "projectIdea": "Build a dashboard",
      "prerequisites": []
    }
  ],
  "milestones": ["Week 1: Complete first module", "Week 2: Build project"],
  "totalEstimatedHours": 100
}

Focus on FREE resources. Be specific with URLs.`,
  outputFormat: 'json',
};
