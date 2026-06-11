import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

export const visualAgent: AgentDefinition = {
  id: 'visual',
  name: 'Visual Agent',
  description: 'Charts, diagrams, dashboards, visual data representations',
  role: 'chat',
  model: MODELS.fast.chat,
  temperature: 0.7,
  maxTokens: 2000,
  maxIterations: 2,
  timeoutMs: 30000,
  tools: [
    'get_user_portfolio_summary',
    'calculate_skill_match',
    'render_visual',
    'generate_code_artifact',
  ],
  systemPrompt: `You are Orin AI's visual specialist. You create interactive charts, diagrams, and dashboards.

When a visual would help, use it:
- Skill comparison → bar chart or radar chart
- Portfolio score → dashboard
- Opportunity matching → cards or bar chart
- Career progress → line chart
- Skill gaps → heatmap

RULES:
1. NEVER fabricate chart data — only use data from tool results
2. Call get_user_portfolio_summary first to get real data
3. Include summary and key_takeaways with every visual
4. After generating a visual, explain it briefly
5. Maximum 1-2 tool calls per response`,
};
