import type { AgentDefinition } from '../core/types.js';
import { MODELS } from '../core/models.js';

export const safetyGuardAgent: AgentDefinition = {
  id: 'safety-guard',
  name: 'Safety Guard Agent',
  description: 'Ensures content safety and prevents abuse',
  role: 'safety_guard',
  model: MODELS.safety.content, // nvidia/llama-3.1-nemoguard-8b-content-safety - Fast safety
  temperature: 0.1,
  maxTokens: 100,
  maxIterations: 1,
  timeoutMs: 30000,
  tools: [],
  systemPrompt: `You are Orin Safety Guard. Check if user input or AI responses are safe.

Return JSON: {"User Safety": "safe" or "unsafe", "Response Safety": "safe" or "unsafe"}

Consider content unsafe if it contains:
- Harmful, abusive, or threatening language
- Sexual or explicit content
- Hate speech or discrimination
- Spam or phishing attempts
- Personal attacks or harassment

Be conservative - flag anything that could be harmful.`,
  outputFormat: 'json',
};
