const fs = require('fs');
const path = require('path');

const NVIDIA_API_KEY = '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Additional models from NVIDIA NIM catalog not in /models endpoint
const ADDITIONAL_MODELS = {
  "Speech-to-Text": [
    {
      id: "nvidia/nemotron-asr-streaming",
      name: "nemotron-asr-streaming",
      provider: "nvidia",
      description: "Real-time speech recognition for English",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Streaming", "English"]
    },
    {
      id: "nvidia/parakeet-1.1b-rnnt-multilingual-asr",
      name: "parakeet-1.1b-rnnt-multilingual-asr",
      provider: "nvidia",
      description: "High accuracy and optimized performance for transcription in 25 languages",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Multilingual", "25 Languages"]
    },
    {
      id: "nvidia/parakeet-ctc-0.6b-zh-tw",
      name: "parakeet-ctc-0.6b-zh-tw",
      provider: "nvidia",
      description: "Record-setting accuracy and performance for Mandarin Taiwanese English transcriptions",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Mandarin", "Taiwanese", "English"]
    },
    {
      id: "nvidia/parakeet-tdt-0.6b-v2",
      name: "parakeet-tdt-0.6b-v2",
      provider: "nvidia",
      description: "Accurate and optimized English transcriptions with punctuation and word timestamps",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "English", "Punctuation", "Timestamps"]
    },
    {
      id: "nvidia/parakeet-ctc-1.1b-asr",
      name: "parakeet-ctc-1.1b-asr",
      provider: "nvidia",
      description: "Record-setting accuracy and performance for English transcription",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "English"]
    },
    {
      id: "nvidia/parakeet-ctc-0.6b-asr",
      name: "parakeet-ctc-0.6b-asr",
      provider: "nvidia",
      description: "State-of-the-art accuracy and speed for English transcriptions",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "English"]
    },
    {
      id: "nvidia/canary-1b-asr",
      name: "canary-1b-asr",
      provider: "nvidia",
      description: "Multi-lingual model supporting speech-to-text recognition and translation",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Multilingual", "Translation"]
    },
    {
      id: "openai/whisper-large-v3",
      name: "whisper-large-v3",
      provider: "openai",
      description: "Robust Speech Recognition via Large-Scale Weak Supervision",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Multilingual", "OpenAI"]
    },
    {
      id: "nvidia/parakeet-ctc-0.6b-vi",
      name: "parakeet-ctc-0.6b-vi",
      provider: "nvidia",
      description: "Accurate and optimized Vietnamese-English transcriptions with punctuation and word timestamps",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Vietnamese", "English"]
    },
    {
      id: "nvidia/parakeet-ctc-0.6b-zh-cn",
      name: "parakeet-ctc-0.6b-zh-cn",
      provider: "nvidia",
      description: "Record-setting accuracy and performance for Mandarin English transcriptions",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Mandarin", "English"]
    },
    {
      id: "nvidia/parakeet-ctc-0.6b-es",
      name: "parakeet-ctc-0.6b-es",
      provider: "nvidia",
      description: "Accurate and optimized Spanish English transcriptions with punctuation and word timestamps",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/asr`,
      tags: ["ASR", "Spanish", "English"]
    }
  ],
  "Text-to-Speech": [
    {
      id: "nvidia/nemotron-voicechat",
      name: "nemotron-voicechat",
      provider: "nvidia",
      description: "Nemotron 3 Voicechat - Ultra-low latency, end-to-end, full duplex models for real-time voice-to-voice interactions",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/tts`,
      tags: ["TTS", "Voice Chat", "Real-time", "English"]
    },
    {
      id: "nvidia/magpie-tts-multilingual",
      name: "magpie-tts-multilingual",
      provider: "nvidia",
      description: "Natural and expressive voices in multiple languages. For voice agents and brand ambassadors",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/tts`,
      tags: ["TTS", "Multilingual", "Voice Cloning"]
    },
    {
      id: "nvidia/magpie-tts-zeroshot",
      name: "magpie-tts-zeroshot",
      provider: "nvidia",
      description: "Expressive and engaging text-to-speech, generated from a short audio sample",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/tts`,
      tags: ["TTS", "Zero-shot", "Voice Cloning"]
    },
    {
      id: "resemble.ai/chatterbox-multilingual-tts",
      name: "chatterbox-multilingual-tts",
      provider: "resemble.ai",
      description: "Natural and expressive voices in 23 languages. For voice agents and brand ambassadors",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/speech/tts`,
      tags: ["TTS", "Multilingual", "23 Languages"]
    }
  ],
  "Image Generation": [
    {
      id: "stabilityai/stable-diffusion-xl",
      name: "stable-diffusion-xl",
      provider: "stabilityai",
      description: "High-quality image generation from text prompts",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/genai/stable-diffusion`,
      tags: ["Text-to-Image", "High Quality"]
    },
    {
      id: "black-forest-labs/flux.1-schnell",
      name: "flux.1-schnell",
      provider: "black-forest-labs",
      description: "Fast image generation model",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/genai/flux`,
      tags: ["Text-to-Image", "Fast"]
    },
    {
      id: "black-forest-labs/flux.1-dev",
      name: "flux.1-dev",
      provider: "black-forest-labs",
      description: "High quality, realistic image generation",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/genai/flux`,
      tags: ["Text-to-Image", "High Quality"]
    }
  ],
  "Object Detection": [
    {
      id: "nvidia/peoplenet",
      name: "peoplenet",
      provider: "nvidia",
      description: "People detection in video streams",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/vision/nvpeoplenet`,
      tags: ["Object Detection", "People", "Video"]
    }
  ],
  "Optical Character Recognition": [
    {
      id: "nvidia/nemotron-ocr-v1",
      name: "nemotron-ocr-v1",
      provider: "nvidia",
      description: "Powerful OCR model for fast, accurate real-world image text extraction, layout, and structure analysis",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/ocr/nemotron`,
      tags: ["OCR", "Text Extraction", "Layout Analysis"]
    }
  ],
  "Digital Twin": [
    {
      id: "nvidia/earth-2",
      name: "earth-2",
      provider: "nvidia",
      description: "Weather and climate simulation platform",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/e2/weather`,
      tags: ["Weather", "Climate", "Simulation"]
    }
  ],
  "Medical Imaging": [
    {
      id: "nvidia/clara-medical-imaging",
      name: "clara-medical-imaging",
      provider: "nvidia",
      description: "Medical imaging AI models",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/medical-imaging`,
      tags: ["Medical", "Imaging", "Healthcare"]
    }
  ],
  "Drug Discovery": [
    {
      id: "nvidia/bionemo-evo2",
      name: "bionemo-evo2",
      provider: "nvidia",
      description: "Genomic foundation model for DNA/RNA sequence understanding",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/bio/nim`,
      tags: ["Biology", "Genomics", "Drug Discovery"]
    },
    {
      id: "nvidia/bionmol-chemical",
      name: "bionmol-chemical",
      provider: "nvidia",
      description: "Molecular generation and property prediction for drug discovery",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/bio/nim`,
      tags: ["Biology", "Molecular", "Drug Discovery"]
    }
  ],
  "Synthetic Data Generation": [
    {
      id: "nvidia/nemotron-synthetic-data",
      name: "nemotron-synthetic-data",
      provider: "nvidia",
      description: "Generate synthetic training data for fine-tuning",
      apiType: "openai-compatible",
      endpoint: `${NVIDIA_BASE_URL}/chat/completions`,
      tags: ["Synthetic Data", "Training Data"]
    }
  ],
  "Route Optimization": [
    {
      id: "nvidia/cuopt",
      name: "cuopt",
      provider: "nvidia",
      description: "GPU-accelerated route optimization solver",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/cuopt`,
      tags: ["Optimization", "Routing", "Logistics"]
    }
  ],
  "Weather Simulation": [
    {
      id: "nvidia/cosmos-world",
      name: "cosmos-world",
      provider: "nvidia",
      description: "World foundation model for physics simulation",
      apiType: "direct",
      endpoint: `${NVIDIA_BASE_URL}/cosmos`,
      tags: ["Physics", "Simulation", "World Model"]
    }
  ]
};

async function fetchModels() {
  console.log('Fetching models from NVIDIA NIM API...');
  
  const response = await fetch(`${NVIDIA_BASE_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`Found ${data.data.length} models from API`);
  return data.data;
}

function categorizeModel(model) {
  const modelId = model.id.toLowerCase();
  const categories = [];

  // Text Generation
  if (modelId.includes('instruct') || modelId.includes('chat') || modelId.includes('llm') ||
      modelId.includes('gemma') || modelId.includes('llama') || modelId.includes('mistral') ||
      modelId.includes('qwen') || modelId.includes('deepseek') || modelId.includes('phi') ||
      modelId.includes('yi-') || modelId.includes('jamba') || modelId.includes('granite') ||
      modelId.includes('solar') || modelId.includes('zamba') || modelId.includes('glm') ||
      modelId.includes('kimi') || modelId.includes('seed') || modelId.includes('dracarys') ||
      modelId.includes('sea-lion') || modelId.includes('dbrx') || modelId.includes('minimax') ||
      modelId.includes('palmyra') || modelId.includes('stockmark') || modelId.includes('step-') ||
      modelId.includes('sarvam') || modelId.includes('gpt-oss')) {
    categories.push('Text Generation');
  }

  // Code Generation
  if (modelId.includes('code') || modelId.includes('starcoder') || modelId.includes('codellama') ||
      modelId.includes('codestral') || modelId.includes('codegemma')) {
    categories.push('Code Generation');
  }

  // Text-to-Embedding
  if (modelId.includes('embed') || modelId.includes('bge') || modelId.includes('arctic-embed')) {
    categories.push('Text-to-Embedding');
  }

  // Vision / Image-to-Text
  if (modelId.includes('vision') || modelId.includes('vlm') || modelId.includes('neva') ||
      modelId.includes('kosmos') || modelId.includes('fuyu') || modelId.includes('vl-') ||
      modelId.includes('omni') || modelId.includes('nemotron-nano-vl') || modelId.includes('nemotron-nano-12b-v2-vl')) {
    categories.push('Vision / Image-to-Text');
  }

  // Safety & Moderation
  if (modelId.includes('guard') || modelId.includes('safety') || modelId.includes('content-safety') ||
      modelId.includes('pii')) {
    categories.push('Safety & Moderation');
  }

  // Text Translation
  if (modelId.includes('translate') || modelId.includes('riva-translate')) {
    categories.push('Text Translation');
  }

  // RAG (Retrieval Augmented Generation)
  if (modelId.includes('retriever') || modelId.includes('rerank') || modelId.includes('chatqa') ||
      modelId.includes('nemoretriever')) {
    categories.push('RAG (Retrieval Augmented Generation)');
  }

  // Video Understanding
  if (modelId.includes('video') || modelId.includes('cosmos-reason')) {
    categories.push('Video Understanding');
  }

  // Reasoning
  if (modelId.includes('reason') || modelId.includes('thinking')) {
    categories.push('Reasoning');
  }

  // Default to Text Generation if no category matched
  if (categories.length === 0) {
    categories.push('Text Generation');
  }

  return categories;
}

function getProvider(model) {
  const parts = model.id.split('/');
  return parts[0] || 'unknown';
}

function getModelName(model) {
  const parts = model.id.split('/');
  return parts.slice(1).join('/') || model.id;
}

function determineApiType(modelId, categories) {
  const lowerId = modelId.toLowerCase();
  
  // Embedding models use /v1/embeddings
  if (lowerId.includes('embed') || lowerId.includes('bge') || lowerId.includes('arctic-embed')) {
    return {
      type: 'openai-compatible',
      endpoint: `${NVIDIA_BASE_URL}/embeddings`
    };
  }

  // Default: OpenAI-compatible chat completions
  return {
    type: 'openai-compatible',
    endpoint: `${NVIDIA_BASE_URL}/chat/completions`
  };
}

function buildModelsJson(apiModels, additionalModels) {
  const categorized = {};

  // Initialize categories
  const allCategories = [
    "Text Generation",
    "Code Generation",
    "Text-to-Embedding",
    "Vision / Image-to-Text",
    "Safety & Moderation",
    "Text Translation",
    "Speech-to-Text",
    "Text-to-Speech",
    "RAG (Retrieval Augmented Generation)",
    "Image Generation",
    "Object Detection",
    "Optical Character Recognition",
    "Digital Twin",
    "Medical Imaging",
    "Drug Discovery",
    "Synthetic Data Generation",
    "Route Optimization",
    "Weather Simulation",
    "Video Understanding",
    "Reasoning"
  ];

  for (const category of allCategories) {
    categorized[category] = [];
  }

  // Process API models
  for (const model of apiModels) {
    const categories = categorizeModel(model);
    const apiInfo = determineApiType(model.id, categories);
    const provider = getProvider(model);
    const modelName = getModelName(model);

    const modelEntry = {
      id: model.id,
      name: modelName,
      provider: provider,
      object: model.object,
      created: model.created,
      apiType: apiInfo.type,
      endpoint: apiInfo.endpoint,
      baseCompatible: true,
      categories: categories
    };

    // Add to each matching category
    for (const category of categories) {
      if (categorized[category]) {
        categorized[category].push(modelEntry);
      }
    }
  }

  // Process additional models
  for (const [category, models] of Object.entries(additionalModels)) {
    for (const model of models) {
      const modelEntry = {
        id: model.id,
        name: model.name,
        provider: model.provider,
        description: model.description,
        apiType: model.apiType,
        endpoint: model.endpoint,
        baseCompatible: true,
        categories: [category],
        tags: model.tags
      };

      if (categorized[category]) {
        categorized[category].push(modelEntry);
      }
    }
  }

  // Build final structure
  const result = {
    metadata: {
      source: "NVIDIA NIM API",
      baseUrl: NVIDIA_BASE_URL,
      fetchedAt: new Date().toISOString(),
      totalModels: apiModels.length + Object.values(additionalModels).flat().length,
      apiModelsCount: apiModels.length,
      additionalModelsCount: Object.values(additionalModels).flat().length,
      categories: Object.keys(categorized).map(cat => ({
        name: cat,
        count: categorized[cat].length
      }))
    },
    models: categorized
  };

  return result;
}

async function main() {
  try {
    const apiModels = await fetchModels();
    const modelsJson = buildModelsJson(apiModels, ADDITIONAL_MODELS);
    
    const outputPath = path.join(__dirname, '__tests__', 'models.json');
    fs.writeFileSync(outputPath, JSON.stringify(modelsJson, null, 2));
    
    console.log(`\nSuccessfully wrote models.json to ${outputPath}`);
    console.log(`\nCategory Summary:`);
    for (const cat of modelsJson.metadata.categories) {
      console.log(`  ${cat.name}: ${cat.count} models`);
    }
    console.log(`\nTotal: ${modelsJson.metadata.totalModels} models`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
