"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguageTool = exports.generateEmbeddingsTool = void 0;
const nvidia_js_1 = require("../core/nvidia.js");
exports.generateEmbeddingsTool = {
    name: 'generate_embeddings',
    description: 'Generate embeddings for text using NVIDIA NIM embedding models',
    category: 'data',
    parameters: {
        type: 'object',
        properties: {
            text: { type: 'string', description: 'Text to generate embeddings for' },
            model: { type: 'string', description: 'Model (default: nvidia/nv-embed-v1)' },
        },
        required: ['text'],
    },
    execute: async (args) => {
        try {
            const result = await (0, nvidia_js_1.generateEmbeddings)(args.text, args.model);
            return { success: true, data: { model: args.model || 'nvidia/nv-embed-v1', dimensions: result.dimensions, tokens_used: result.tokensUsed } };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },
};
exports.detectLanguageTool = {
    name: 'detect_language',
    description: 'Detect the programming language of code',
    category: 'data',
    parameters: {
        type: 'object',
        properties: {
            code: { type: 'string', description: 'Code snippet to analyze' },
        },
        required: ['code'],
    },
    execute: async (args) => {
        try {
            const patterns = {
                javascript: [/const\s+\w+\s*=/, /let\s+\w+\s*=/, /=>\s*{/, /import\s+.*from/],
                typescript: [/:\s*(string|number|boolean|any)/, /interface\s+\w+/, /type\s+\w+\s*=/],
                python: [/def\s+\w+\s*\(/, /import\s+\w+/, /from\s+\w+\s+import/, /class\s+\w+.*:/],
                java: [/public\s+class/, /private\s+/, /System\.out/],
                go: [/func\s+\w+/, /package\s+\w+/],
                rust: [/fn\s+\w+/, /let\s+mut/, /impl\s+\w+/],
                sql: [/SELECT\s+/i, /FROM\s+/i, /WHERE\s+/i],
            };
            const scores = {};
            for (const [lang, regexes] of Object.entries(patterns)) {
                scores[lang] = regexes.filter(r => r.test(args.code)).length;
            }
            const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
            return {
                success: true,
                data: { language: detected[1] > 0 ? detected[0] : 'unknown', confidence: detected[1] / (patterns[detected[0]]?.length || 1) },
            };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },
};
//# sourceMappingURL=data.tools.js.map