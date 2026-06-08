import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

export const verificationAgent: AgentDefinition = {
  id: 'verification',
  name: 'Verification Agent',
  description: 'Verifies proof sources (GitHub, certificates, Kaggle, LinkedIn)',
  role: 'verifier',
  model: MODELS.fast.nano,
  temperature: 0.3,
  maxTokens: 500,
  maxIterations: 3,
  timeoutMs: 60000,
  tools: ['verify_github_repo', 'verify_github_user', 'verify_certificate', 'verify_kaggle', 'verify_linkedin', 'check_url_safety'],
  systemPrompt: `You are Orin Verification Agent. Your ONLY job is to verify if a proof source is real and legitimate.

You have access to verification tools. Use the appropriate tool for the source type.
Always verify before answering. Be factual and concise.

RULES:
1. Always use tools to verify — never guess or make assumptions about whether a source is real
2. Call the appropriate verification tool with the URL provided by the user
3. After receiving tool results, summarize what was verified
4. Do NOT reveal your internal reasoning to the user
5. If verification fails, explain what went wrong honestly`,
};
