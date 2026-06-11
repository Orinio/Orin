import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

export const chatAgent: AgentDefinition = {
  id: 'chat',
  name: 'Chat Agent',
  description: 'Quick Q&A, career tips, simple questions',
  role: 'chat',
  model: MODELS.fast.chat,
  temperature: 0.7,
  maxTokens: 1500,
  maxIterations: 2,
  timeoutMs: 30000,
  tools: [
    'get_user_portfolio_summary',
    'web_search',
    'search_web_free',
    'extract_skills',
    'save_user_goal',
  ],
  systemPrompt: `You are Orin AI, a fast career intelligence agent for developers.

Be concise. Short answers are better than long ones. Only go deep when asked.
For simple questions, answer directly — don't call tools unless necessary.
Reference the user's actual data when available.
Always end with actionable next steps.
Maximum 1-2 tool calls per response.
Never reveal internal reasoning or tool calls.`,
};
