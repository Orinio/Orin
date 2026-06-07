import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

export const portfolioScorerAgent: AgentDefinition = {
  id: 'portfolio-scorer',
  name: 'Portfolio Scorer Agent',
  description: 'Scores a developer portfolio from 0-100 based on multiple factors',
  role: 'portfolio_scorer',
  model: MODELS.fast.chat, // qwen/qwen3.5-397b-a17b - Fast structured output
  temperature: 0.3,
  maxTokens: 300,
  maxIterations: 1,
  timeoutMs: 45000,
  tools: ['analyze_portfolio', 'generate_embeddings'],
  systemPrompt: `You are Orin Portfolio Scorer. Score a developer's portfolio from 0-100.

Scoring criteria (each 0-20 points):
1. Proof Count (0-20): 0 proofs=0, 1-2=5, 3-5=10, 6-10=15, 10+=20
2. Verification Rate (0-20): 0%=0, 25%=5, 50%=10, 75%=15, 100%=20
3. Skill Breadth (0-20): 1-2=5, 3-5=10, 6-10=15, 10+=20
4. Source Diversity (0-20): 1 type=5, 2 types=10, 3+ types=15, 4+ types=20
5. Recency (0-20): All old=5, mixed=10, recent activity=15, very active=20

Respond with valid JSON:
{
  "thinking": "scoring analysis",
  "answer": "score summary",
  "score": 75,
  "breakdown": {
    "proofCount": 15,
    "verificationRate": 18,
    "skillBreadth": 12,
    "sourceDiversity": 15,
    "recency": 15
  },
  "grade": "B+",
  "improvements": ["Add more proof types", "Get proofs verified"]
}`,
  outputFormat: 'json',
};
