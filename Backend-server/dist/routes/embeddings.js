"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingRouter = void 0;
const express_1 = require("express");
const logger_js_1 = require("../lib/logger.js");
const nvidia_js_1 = require("../lib/ai/core/nvidia.js");
const embedding_service_js_1 = require("../lib/ai/services/embedding.service.js");
const rate_limit_js_1 = require("../middleware/rate-limit.js");
exports.embeddingRouter = (0, express_1.Router)();
/**
 * POST /ai/embeddings/generate - Generate embedding for text
 */
exports.embeddingRouter.post('/generate', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-embeddings'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { text, model } = req.body;
        if (!text || typeof text !== 'string') {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
            return;
        }
        const result = await (0, embedding_service_js_1.generateEmbedding)(text, model);
        res.json({
            success: true,
            data: {
                embedding: result.embedding,
                dimensions: result.dimensions,
                tokensUsed: result.tokensUsed
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Embedding generation failed');
        res.status(500).json({ error: { code: 'EMBEDDING_ERROR', message: 'Failed to generate embedding' } });
    }
});
/**
 * POST /ai/embeddings/batch - Generate embeddings for multiple texts
 */
exports.embeddingRouter.post('/batch', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-embeddings-batch'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { texts, model } = req.body;
        if (!Array.isArray(texts) || texts.length === 0) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Texts array is required' } });
            return;
        }
        if (texts.length > 100) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Maximum 100 texts per batch' } });
            return;
        }
        const results = await (0, embedding_service_js_1.generateEmbeddings)(texts, model);
        res.json({
            success: true,
            data: {
                embeddings: results.map(r => r.embedding),
                dimensions: results[0]?.dimensions || 0,
                totalTokens: results.reduce((sum, r) => sum + r.tokensUsed, 0)
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Batch embedding generation failed');
        res.status(500).json({ error: { code: 'EMBEDDING_ERROR', message: 'Failed to generate embeddings' } });
    }
});
/**
 * POST /ai/embeddings/similarity - Calculate similarity between texts
 */
exports.embeddingRouter.post('/similarity', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-embeddings-similarity'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { text1, text2 } = req.body;
        if (!text1 || !text2) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Both text1 and text2 are required' } });
            return;
        }
        const [result1, result2] = await Promise.all([
            (0, embedding_service_js_1.generateEmbedding)(text1),
            (0, embedding_service_js_1.generateEmbedding)(text2)
        ]);
        const similarity = (0, embedding_service_js_1.cosineSimilarity)(result1.embedding, result2.embedding);
        res.json({
            success: true,
            data: {
                similarity: Math.round(similarity * 100) / 100,
                percentage: Math.round(similarity * 100)
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Similarity calculation failed');
        res.status(500).json({ error: { code: 'EMBEDDING_ERROR', message: 'Failed to calculate similarity' } });
    }
});
/**
 * POST /ai/embeddings/skills/extract - Extract skills and generate embeddings
 */
exports.embeddingRouter.post('/skills/extract', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-embeddings-extract'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { text } = req.body;
        if (!text) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
            return;
        }
        // Extract skills using pattern matching
        const skillPatterns = {
            'Programming Languages': ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin'],
            'Web Frameworks': ['react', 'next.js', 'vue', 'angular', 'svelte', 'node.js', 'express', 'django', 'flask', 'fastapi'],
            'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions'],
            'Databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase', 'prisma'],
            'Data Science': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'machine learning', 'deep learning', 'nlp'],
            'Tools': ['git', 'github', 'vs code', 'figma', 'postman', 'jira', 'notion', 'webpack', 'vite'],
            'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'agile', 'scrum'],
        };
        const foundSkills = [];
        const lowerText = text.toLowerCase();
        for (const [_category, skills] of Object.entries(skillPatterns)) {
            for (const skill of skills) {
                if (lowerText.includes(skill.toLowerCase())) {
                    foundSkills.push(skill);
                }
            }
        }
        // Generate embeddings for found skills
        let embeddings = [];
        if (foundSkills.length > 0) {
            const embeddingResults = await (0, embedding_service_js_1.generateEmbeddings)(foundSkills);
            embeddings = embeddingResults.map(r => r.embedding);
        }
        res.json({
            success: true,
            data: {
                skills: foundSkills,
                embeddings,
                count: foundSkills.length
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Skill extraction failed');
        res.status(500).json({ error: { code: 'SKILL_ERROR', message: 'Failed to extract skills' } });
    }
});
//# sourceMappingURL=embeddings.js.map