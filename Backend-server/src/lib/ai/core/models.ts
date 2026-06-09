/**
 * Orin AI - Model Configuration
 * Selected models from NVIDIA NIM competition testing
 */

// ============================================================
// API Configuration
// ============================================================
export const NVIDIA_CONFIG = {
  baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
  get isConfigured() {
    return !!this.apiKey;
  }
};

// ============================================================
// Model Registry - Winners from Competition Testing
// ============================================================
export const MODELS = {
  // Primary Models (Best Overall)
  primary: {
    chat: 'qwen/qwen3.5-397b-a17b',           // Best speed + tool calling
    coach: 'qwen/qwen3-coder-480b-a35b-instruct', // Best quality
    learning: 'openai/gpt-oss-120b',            // GPT OSS 120B - detailed reasoning
  },

  // Non-Chat AI Features (GPT OSS 120B as default)
  ai: {
    verification: 'openai/gpt-oss-120b',        // Proof verification
    skillAnalysis: 'openai/gpt-oss-120b',       // Skill extraction & analysis
    learningPath: 'openai/gpt-oss-120b',        // Learning path generation
    portfolioScoring: 'openai/gpt-oss-120b',    // Portfolio scoring
    opportunityMatching: 'openai/gpt-oss-120b', // Opportunity matching
  },

  // Fast Models (Speed Priority)
  fast: {
    chat: 'qwen/qwen3.5-397b-a17b',           // 3.8s, 69 tokens/sec
    quick: 'meta/llama-3.2-3b-instruct',       // 4.1s, 95 tokens/sec
    nano: 'nvidia/llama-3.1-nemotron-nano-8b-v1', // 5.9s, 92 tokens/sec
  },

  // Quality Models (Accuracy Priority)
  quality: {
    reasoning: 'qwen/qwen3-coder-480b-a35b-instruct', // 63/100
    analysis: 'nvidia/llama-3.3-nemotron-super-49b-v1', // Good quality
    detailed: 'meta/llama-3.1-70b-instruct',    // When available
  },

  // Vision Models (Image Understanding)
  vision: {
    primary: 'meta/llama-3.2-90b-vision-instruct',    // Best vision
    fast: 'meta/llama-3.2-11b-vision-instruct',       // Faster alternative
    nano: 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1',  // Lightweight
  },

  // Embedding Models (Vector Search)
  embedding: {
    primary: 'baai/bge-m3',                    // Fastest (882ms, 1024 dim)
    quality: 'nvidia/nv-embed-v1',             // Higher quality (4096 dim)
  },

  // Safety Models (Content Moderation)
  safety: {
    content: 'nvidia/llama-3.1-nemoguard-8b-content-safety', // 1.0s
    topic: 'nvidia/llama-3.1-nemoguard-8b-topic-control',    // 0.9s
    pii: 'nvidia/gliner-pii',                           // 0.5s
    guard: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3', // Backup
  },

  // Tool Calling Models (Function Invocation)
  toolCalling: {
    primary: 'qwen/qwen3.5-397b-a17b',         // Best tool calling
    fallback: 'minimaxai/minimax-m2.7',         // Also correct
  },

  // Code Analysis Models
  code: {
    primary: 'qwen/qwen3-coder-480b-a35b-instruct', // Best code understanding
    fast: 'nvidia/llama-3.1-nemotron-nano-8b-v1',    // Quick analysis
  }
};

// ============================================================
// Model Metadata (for documentation and UI)
// ============================================================
export const MODEL_METADATA = {
  'openai/gpt-oss-120b': {
    name: 'GPT OSS 120B',
    provider: 'OpenAI',
    category: 'Text Generation',
    speed: 'medium',
    quality: 'highest',
    toolCalling: true,
    contextWindow: '128K',
    description: 'Open-source GPT model for high-quality reasoning, verification, and analysis'
  },
  'qwen/qwen3.5-397b-a17b': {
    name: 'Qwen 3.5 397B',
    provider: 'Qwen',
    category: 'Text Generation',
    speed: 'fast',
    quality: 'high',
    toolCalling: true,
    contextWindow: '32K',
    description: 'Fastest heavy model with excellent tool calling capabilities'
  },
  'qwen/qwen3-coder-480b-a35b-instruct': {
    name: 'Qwen 3 Coder 480B',
    provider: 'Qwen',
    category: 'Code Generation',
    speed: 'medium',
    quality: 'highest',
    toolCalling: false,
    contextWindow: '32K',
    description: 'Best quality responses for complex reasoning and code analysis'
  },
  'meta/llama-3.2-90b-vision-instruct': {
    name: 'Llama 3.2 90B Vision',
    provider: 'Meta',
    category: 'Vision',
    speed: 'slow',
    quality: 'highest',
    multimodal: true,
    description: 'Best vision understanding for certificate verification'
  },
  'baai/bge-m3': {
    name: 'BGE M3',
    provider: 'BAAI',
    category: 'Embedding',
    speed: 'fastest',
    dimensions: 1024,
    description: 'Fastest embedding model for skill matching'
  },
  'nvidia/llama-3.1-nemoguard-8b-content-safety': {
    name: 'NeMo Guard Content Safety',
    provider: 'NVIDIA',
    category: 'Safety',
    speed: 'fast',
    description: 'Content safety classification'
  },
  'nvidia/gliner-pii': {
    name: 'GLiNER PII',
    provider: 'NVIDIA',
    category: 'Safety',
    speed: 'fastest',
    description: 'PII detection and extraction'
  }
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get model for a specific use case
 */
export function getModelForUseCase(useCase: keyof typeof MODELS): string {
  const category = MODELS[useCase];
  if (!category || typeof category !== 'object') {
    return MODELS.primary.chat; // Fallback
  }
  return (category as any).primary || Object.values(category)[0];
}

/**
 * Get all available models as an array
 */
export function getAllModels(): Array<{ id: string; metadata: any }> {
  return Object.entries(MODEL_METADATA).map(([id, metadata]) => ({
    id,
    metadata
  }));
}

/**
 * Check if a model supports tool calling
 */
export function supportsToolCalling(modelId: string): boolean {
  return modelId === MODELS.toolCalling.primary || 
         modelId === MODELS.toolCalling.fallback;
}

/**
 * Get the best model for a given criteria
 */
export function getBestModel(criteria: {
  speed?: 'fastest' | 'fast' | 'medium' | 'slow';
  quality?: 'highest' | 'high' | 'medium';
  toolCalling?: boolean;
  multimodal?: boolean;
}): string {
  const models = Object.entries(MODEL_METADATA);
  
  let filtered = models;
  
  if (criteria.toolCalling) {
    filtered = filtered.filter(([_, m]) => (m as any).toolCalling);
  }
  
  if (criteria.multimodal) {
    filtered = filtered.filter(([_, m]) => (m as any).multimodal);
  }
  
  if (filtered.length === 0) filtered = models;
  
  // Sort by speed if specified
  if (criteria.speed) {
    const speedOrder = { fastest: 0, fast: 1, medium: 2, slow: 3 };
    filtered.sort((a, b) => {
      const aSpeed = speedOrder[a[1].speed as keyof typeof speedOrder] ?? 2;
      const bSpeed = speedOrder[b[1].speed as keyof typeof speedOrder] ?? 2;
      return aSpeed - bSpeed;
    });
  }
  
  return filtered[0]?.[0] || MODELS.primary.chat;
}
