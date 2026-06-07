/**
 * Orin AI - Embedding Service
 * Uses baai/bge-m3 for fast skill matching
 */
export interface EmbeddingResult {
    embedding: number[];
    dimensions: number;
    tokensUsed: number;
}
export interface SkillEmbedding {
    skill: string;
    embedding: number[];
    category?: string;
}
/**
 * Generate embeddings for text input
 */
export declare function generateEmbedding(text: string, model?: string): Promise<EmbeddingResult>;
/**
 * Generate embeddings for multiple texts (batch)
 */
export declare function generateEmbeddings(texts: string[], model?: string): Promise<EmbeddingResult[]>;
/**
 * Calculate cosine similarity between two embeddings
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Find most similar skills from a list
 */
export declare function findSimilarSkills(queryEmbedding: number[], skillEmbeddings: SkillEmbedding[], topK?: number, threshold?: number): Array<SkillEmbedding & {
    similarity: number;
}>;
/**
 * Extract skills from text and generate embeddings
 */
export declare function extractAndEmbedSkills(text: string): Promise<{
    skills: string[];
    embeddings: number[][];
}>;
/**
 * Match skills to opportunities using embeddings
 */
export declare function matchSkillsToOpportunities(userSkills: string[], opportunitySkills: string[][], topK?: number): Promise<Array<{
    opportunityIndex: number;
    matchScore: number;
    matchedSkills: string[];
}>>;
//# sourceMappingURL=embedding.service.d.ts.map