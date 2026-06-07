"use strict";
/**
 * Orin AI - Embedding Service
 * Uses baai/bge-m3 for fast skill matching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.generateEmbeddings = generateEmbeddings;
exports.cosineSimilarity = cosineSimilarity;
exports.findSimilarSkills = findSimilarSkills;
exports.extractAndEmbedSkills = extractAndEmbedSkills;
exports.matchSkillsToOpportunities = matchSkillsToOpportunities;
const models_js_1 = require("../core/models.js");
const logger_js_1 = require("../../logger.js");
/**
 * Generate embeddings for text input
 */
async function generateEmbedding(text, model = models_js_1.MODELS.embedding.primary) {
    if (!models_js_1.NVIDIA_CONFIG.isConfigured) {
        throw new Error('NVIDIA API key not configured');
    }
    const startTime = Date.now();
    try {
        const response = await fetch(`${models_js_1.NVIDIA_CONFIG.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${models_js_1.NVIDIA_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                input: text
            }),
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const embedding = data.data?.[0]?.embedding || [];
        const dimensions = embedding.length;
        const tokensUsed = data.usage?.total_tokens || 0;
        logger_js_1.logger.info({
            model,
            textLength: text.length,
            dimensions,
            tokensUsed,
            durationMs: Date.now() - startTime
        }, 'Embedding generated');
        return {
            embedding,
            dimensions,
            tokensUsed
        };
    }
    catch (error) {
        logger_js_1.logger.error({ error, model, text }, 'Embedding generation failed');
        throw error;
    }
}
/**
 * Generate embeddings for multiple texts (batch)
 */
async function generateEmbeddings(texts, model = models_js_1.MODELS.embedding.primary) {
    if (!models_js_1.NVIDIA_CONFIG.isConfigured) {
        throw new Error('NVIDIA API key not configured');
    }
    const startTime = Date.now();
    try {
        const response = await fetch(`${models_js_1.NVIDIA_CONFIG.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${models_js_1.NVIDIA_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                input: texts
            }),
            signal: AbortSignal.timeout(30000)
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const results = (data.data || []).map((item) => ({
            embedding: item.embedding || [],
            dimensions: item.embedding?.length || 0,
            tokensUsed: 0
        }));
        const totalTokens = data.usage?.total_tokens || 0;
        logger_js_1.logger.info({
            model,
            batchSize: texts.length,
            totalTokens,
            durationMs: Date.now() - startTime
        }, 'Batch embeddings generated');
        // Distribute tokens across results
        const tokensPerItem = Math.ceil(totalTokens / results.length);
        results.forEach((r) => r.tokensUsed = tokensPerItem);
        return results;
    }
    catch (error) {
        logger_js_1.logger.error({ error, model, batchSize: texts.length }, 'Batch embedding failed');
        throw error;
    }
}
/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Embeddings must have same dimensions');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
/**
 * Find most similar skills from a list
 */
function findSimilarSkills(queryEmbedding, skillEmbeddings, topK = 5, threshold = 0.5) {
    const results = skillEmbeddings
        .map(skill => ({
        ...skill,
        similarity: cosineSimilarity(queryEmbedding, skill.embedding)
    }))
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    return results;
}
/**
 * Extract skills from text and generate embeddings
 */
async function extractAndEmbedSkills(text) {
    // Extract skills using pattern matching
    const skillPatterns = {
        'Programming Languages': ['javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin'],
        'Web Frameworks': ['react', 'next\\.?js', 'vue', 'angular', 'svelte', 'node\\.?js', 'express', 'django', 'flask', 'fastapi'],
        'Cloud & DevOps': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions'],
        'Databases': ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase', 'prisma'],
        'Data Science': ['pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'machine learning', 'deep learning', 'nlp'],
        'Tools': ['git', 'github', 'vs code', 'figma', 'postman', 'jira', 'notion', 'webpack', 'vite'],
        'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'agile', 'scrum'],
    };
    const foundSkills = [];
    const lowerText = text.toLowerCase();
    for (const [_, skills] of Object.entries(skillPatterns)) {
        for (const skill of skills) {
            if (new RegExp(skill, 'i').test(lowerText)) {
                foundSkills.push(skill);
            }
        }
    }
    // Generate embeddings for found skills
    if (foundSkills.length > 0) {
        const embeddings = await generateEmbeddings(foundSkills);
        return {
            skills: foundSkills,
            embeddings: embeddings.map(e => e.embedding)
        };
    }
    return { skills: [], embeddings: [] };
}
/**
 * Match skills to opportunities using embeddings
 */
async function matchSkillsToOpportunities(userSkills, opportunitySkills, topK = 5) {
    // Generate embeddings for user skills
    const userEmbeddings = await generateEmbeddings(userSkills);
    const userEmbeddingAvg = averageEmbeddings(userEmbeddings.map(e => e.embedding));
    const results = [];
    for (let i = 0; i < opportunitySkills.length; i++) {
        const oppSkills = opportunitySkills[i];
        const oppEmbeddings = await generateEmbeddings(oppSkills);
        const oppEmbeddingAvg = averageEmbeddings(oppEmbeddings.map(e => e.embedding));
        const similarity = cosineSimilarity(userEmbeddingAvg, oppEmbeddingAvg);
        // Find matching skills by exact match
        const matchedSkills = userSkills.filter(skill => oppSkills.some(opp => opp.toLowerCase().includes(skill.toLowerCase())));
        results.push({
            opportunityIndex: i,
            matchScore: Math.round(similarity * 100),
            matchedSkills
        });
    }
    return results
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, topK);
}
/**
 * Average multiple embeddings into one
 */
function averageEmbeddings(embeddings) {
    if (embeddings.length === 0)
        return [];
    if (embeddings.length === 1)
        return embeddings[0];
    const dimensions = embeddings[0].length;
    const avg = new Array(dimensions).fill(0);
    for (const emb of embeddings) {
        for (let i = 0; i < dimensions; i++) {
            avg[i] += emb[i];
        }
    }
    return avg.map(v => v / embeddings.length);
}
//# sourceMappingURL=embedding.service.js.map