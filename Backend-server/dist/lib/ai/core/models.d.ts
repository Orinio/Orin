/**
 * Orin AI - Model Configuration
 * Selected models from NVIDIA NIM competition testing
 */
export declare const NVIDIA_CONFIG: {
    baseUrl: string;
    apiKey: string;
    readonly isConfigured: boolean;
};
export declare const MODELS: {
    primary: {
        chat: string;
        coach: string;
        learning: string;
    };
    ai: {
        verification: string;
        skillAnalysis: string;
        learningPath: string;
        portfolioScoring: string;
        opportunityMatching: string;
    };
    fast: {
        chat: string;
        quick: string;
        nano: string;
    };
    quality: {
        reasoning: string;
        analysis: string;
        detailed: string;
    };
    vision: {
        primary: string;
        fast: string;
        nano: string;
    };
    embedding: {
        primary: string;
        quality: string;
    };
    safety: {
        content: string;
        topic: string;
        pii: string;
        guard: string;
    };
    toolCalling: {
        primary: string;
        fallback: string;
    };
    code: {
        primary: string;
        fast: string;
    };
};
export declare const MODEL_METADATA: {
    'openai/gpt-oss-120b': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        quality: string;
        toolCalling: boolean;
        contextWindow: string;
        description: string;
    };
    'qwen/qwen3.5-397b-a17b': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        quality: string;
        toolCalling: boolean;
        contextWindow: string;
        description: string;
    };
    'qwen/qwen3-coder-480b-a35b-instruct': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        quality: string;
        toolCalling: boolean;
        contextWindow: string;
        description: string;
    };
    'meta/llama-3.2-90b-vision-instruct': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        quality: string;
        multimodal: boolean;
        description: string;
    };
    'baai/bge-m3': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        dimensions: number;
        description: string;
    };
    'nvidia/llama-3.1-nemoguard-8b-content-safety': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        description: string;
    };
    'nvidia/gliner-pii': {
        name: string;
        provider: string;
        category: string;
        speed: string;
        description: string;
    };
};
/**
 * Get model for a specific use case
 */
export declare function getModelForUseCase(useCase: keyof typeof MODELS): string;
/**
 * Get all available models as an array
 */
export declare function getAllModels(): Array<{
    id: string;
    metadata: any;
}>;
/**
 * Check if a model supports tool calling
 */
export declare function supportsToolCalling(modelId: string): boolean;
/**
 * Get the best model for a given criteria
 */
export declare function getBestModel(criteria: {
    speed?: 'fastest' | 'fast' | 'medium' | 'slow';
    quality?: 'highest' | 'high' | 'medium';
    toolCalling?: boolean;
    multimodal?: boolean;
}): string;
//# sourceMappingURL=models.d.ts.map