"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyGuardAgent = void 0;
const models_js_1 = require("../core/models.js");
exports.safetyGuardAgent = {
    id: 'safety-guard',
    name: 'Safety Guard Agent',
    description: 'Ensures content safety and prevents abuse',
    model: models_js_1.MODELS.safety.content, // nvidia/llama-3.1-nemoguard-8b-content-safety - Fast safety
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
//# sourceMappingURL=safety-guard.agent.js.map