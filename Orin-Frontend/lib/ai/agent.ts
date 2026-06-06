import { allTools, getToolByName, type Tool, type ToolResult, type ToolCall, type AgentResponse } from './tools';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// ============================================================
// Selected Models from Competition Testing
// ============================================================
const MODELS = {
  // Primary Models (Best Overall)
  primary: {
    chat: 'qwen/qwen3.5-397b-a17b',           // Best speed + tool calling
    coach: 'qwen/qwen3-coder-480b-a35b-instruct', // Best quality
    learning: 'qwen/qwen3-coder-480b-a35b-instruct', // Detailed reasoning
  },

  // Fast Models (Speed Priority)
  fast: {
    chat: 'qwen/qwen3.5-397b-a17b',           // 3.8s, 69 tokens/sec
    quick: 'meta/llama-3.2-3b-instruct',       // 4.1s, 95 tokens/sec
    nano: 'nvidia/llama-3.1-nemotron-nano-8b-v1', // 5.9s, 92 tokens/sec
  },

  // Vision Models (Image Understanding)
  vision: {
    primary: 'meta/llama-3.2-90b-vision-instruct',    // Best vision
    fast: 'meta/llama-3.2-11b-vision-instruct',       // Faster alternative
  },

  // Embedding Models (Vector Search)
  embedding: {
    primary: 'baai/bge-m3',                    // Fastest (882ms, 1024 dim)
  },

  // Safety Models (Content Moderation)
  safety: {
    content: 'nvidia/llama-3.1-nemoguard-8b-content-safety', // 1.0s
    pii: 'nvidia/gliner-pii',                           // 0.5s
  },

  // Tool Calling Models (Function Invocation)
  toolCalling: {
    primary: 'qwen/qwen3.5-397b-a17b',         // Best tool calling
  }
};

const MAX_INPUT_LENGTH = 2000;
const MAX_AGENT_ITERATIONS = 5;

export interface AgentConfig {
  model?: string;
  maxIterations?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResult {
  answer: string;
  thinking: string;
  toolCalls: { tool: string; args: any; result: ToolResult }[];
  iterations: number;
  totalTokens: number;
}

const DEFAULT_CONFIG: AgentConfig = {
  model: MODELS.toolCalling.primary, // Best for tool calling
  maxIterations: 5,
  temperature: 0.3,
  maxTokens: 500
};

function buildSystemPrompt(): string {
  const toolDescriptions = allTools.map(t =>
    `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`
  ).join('\n');

  return `You are Orin AI Agent with access to ${allTools.length} tools. You MUST respond ONLY with valid JSON.

Tool use format (when you need information):
{"thinking":"your reasoning about what to do","tool_call":{"name":"tool_name","arguments":{"param":"value"}}}

Final answer format (when you have enough information):
{"thinking":"your reasoning","answer":"your final answer to the user"}

Available tools by category:

VERIFICATION:
- verify_github_repo(url): Verify GitHub repository exists
- verify_github_user(username): Verify GitHub user exists
- verify_certificate(url): Verify certificate URL (Coursera, Udemy, edX)
- verify_kaggle(url): Verify Kaggle notebook/dataset
- verify_linkedin(url): Verify LinkedIn profile URL

SEARCH:
- web_search(query): Search the web for information
- fetch_webpage(url): Fetch and extract text from webpage

ANALYSIS:
- analyze_code(repo_url, file_path): Analyze code from GitHub
- extract_skills(text): Extract technical skills from text
- analyze_portfolio(proofs): Analyze proof portfolio

SAFETY:
- check_url_safety(url): Check if URL is safe
- validate_email(email): Validate email format

DATA:
- generate_embeddings(text): Generate text embeddings
- detect_language(code): Detect programming language

RULES:
1. Always respond with valid JSON only - no extra text outside JSON
2. Use tools to verify information before answering
3. You can use multiple tools in sequence (max 5 iterations)
4. When you have enough information, provide your final answer
5. Be concise and factual
6. Always check safety before providing URLs`;
}

export async function runAgent(
  userQuery: string,
  config: AgentConfig = {}
): Promise<AgentResult> {
  // Graceful fallback if NVIDIA API key is not configured
  if (!NVIDIA_API_KEY) {
    return {
      answer: 'AI service is not configured. Please try again later.',
      thinking: '',
      toolCalls: [],
      iterations: 0,
      totalTokens: 0,
    };
  }

  // Input length limit
  const truncatedQuery = userQuery.length > MAX_INPUT_LENGTH
    ? userQuery.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
    : userQuery;

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: truncatedQuery }
  ];

  const toolCalls: { tool: string; args: any; result: ToolResult }[] = [];
  let iterations = 0;
  let totalTokens = 0;
  let finalAnswer = '';
  let thinking = '';

  while (iterations < cfg.maxIterations!) {
    iterations++;

    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('NVIDIA NIM API error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    totalTokens += data.usage?.total_tokens || 0;

    let parsed: AgentResponse;
    try {
      const cleaned = content.replace(/[\r\n\t]/g, ' ').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      finalAnswer = content;
      thinking = 'Response was not valid JSON, using raw content';
      break;
    }

    thinking = parsed.thinking || thinking;

    if (parsed.answer) {
      finalAnswer = parsed.answer;
      break;
    }

    if (parsed.tool_call) {
      const tool = getToolByName(parsed.tool_call.name);
      if (!tool) {
        toolCalls.push({
          tool: parsed.tool_call.name,
          args: parsed.tool_call.arguments,
          result: { success: false, error: `Tool '${parsed.tool_call.name}' not found` }
        });
        messages.push({
          role: 'user',
          content: `Tool '${parsed.tool_call.name}' does not exist. Available tools: ${allTools.map(t => t.name).join(', ')}`
        });
        continue;
      }

      const result = await tool.execute(parsed.tool_call.arguments);
      toolCalls.push({
        tool: parsed.tool_call.name,
        args: parsed.tool_call.arguments,
        result
      });

      messages.push({
        role: 'assistant',
        content: JSON.stringify({ tool_call: parsed.tool_call })
      });
      messages.push({
        role: 'user',
        content: `Tool result for ${parsed.tool_call.name}: ${JSON.stringify(result).substring(0, 1000)}`
      });
    }
  }

  return {
    answer: finalAnswer,
    thinking,
    toolCalls,
    iterations,
    totalTokens
  };
}

export async function verifyProof(proofUrl: string, sourceType: string): Promise<AgentResult> {
  let query = '';

  switch (sourceType) {
    case 'github':
      query = `Verify this GitHub repository: ${proofUrl}. Use verify_github_repo tool to check if it exists and get details.`;
      break;
    case 'certificate':
      query = `Verify this certificate URL: ${proofUrl}. Use verify_certificate tool to check if it's valid.`;
      break;
    case 'kaggle':
      query = `Check this Kaggle notebook/dataset: ${proofUrl}. Use verify_kaggle tool.`;
      break;
    case 'blog':
      query = `Fetch and analyze this blog post: ${proofUrl}. Use fetch_webpage tool.`;
      break;
    case 'linkedin':
      query = `Verify this LinkedIn profile: ${proofUrl}. Use verify_linkedin tool.`;
      break;
    default:
      query = `Verify this URL is safe and accessible: ${proofUrl}. Use check_url_safety and fetch_webpage tools.`;
  }

  return runAgent(query, { model: MODELS.fast.nano, maxIterations: 3 });
}

export async function analyzeProofQuality(proof: {
  title: string;
  description?: string;
  skills: string[];
  sourceType: string;
  url?: string;
}): Promise<AgentResult> {
  let query = `Analyze this proof card and provide feedback:\n`;
  query += `Title: ${proof.title}\n`;
  query += `Description: ${proof.description || 'No description'}\n`;
  query += `Skills: ${proof.skills.join(', ')}\n`;
  query += `Type: ${proof.sourceType}\n`;
  if (proof.url) query += `URL: ${proof.url}\n`;
  query += `\nProvide constructive feedback on how to improve this proof card. Use extract_skills to analyze the description.`;

  return runAgent(query, { model: MODELS.fast.chat, maxIterations: 2 });
}

export async function extractSkillsFromText(text: string): Promise<AgentResult> {
  return runAgent(
    `Extract all technical skills from this text: "${text}". Use the extract_skills tool.`,
    { model: MODELS.fast.chat, maxIterations: 1 }
  );
}

export async function checkUrlSafety(url: string): Promise<AgentResult> {
  return runAgent(
    `Check if this URL is safe: ${url}. Use check_url_safety tool and provide a safety assessment.`,
    { model: MODELS.fast.nano, maxIterations: 2 }
  );
}

export async function analyzeGitHubProfile(username: string): Promise<AgentResult> {
  return runAgent(
    `Analyze this GitHub profile: ${username}. Use verify_github_user tool to get their profile information.`,
    { model: MODELS.fast.chat, maxIterations: 2 }
  );
}

// ============================================================
// New AI Services (Embedding, Vision, Safety)
// ============================================================

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<{
  embedding: number[];
  dimensions: number;
  tokensUsed: number;
}> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODELS.embedding.primary,
      input: text
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  const embedding = data.data?.[0]?.embedding || [];

  return {
    embedding,
    dimensions: embedding.length,
    tokensUsed: data.usage?.total_tokens || 0
  };
}

/**
 * Analyze image with vision model
 */
export async function analyzeImage(imageUrl: string, prompt?: string): Promise<{
  content: string;
  tokensUsed: number;
}> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODELS.vision.primary,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt || 'Describe what you see in this image.' },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }],
      max_tokens: 500,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0
  };
}

/**
 * Check content safety
 */
export async function checkContentSafety(text: string): Promise<{
  isSafe: boolean;
  userSafety: string;
  responseSafety: string;
}> {
  if (!NVIDIA_API_KEY) {
    return { isSafe: true, userSafety: 'safe', responseSafety: 'safe' };
  }

  try {
    const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODELS.safety.content,
        messages: [{
          role: 'user',
          content: `Check if this content is safe. Return JSON: {"User Safety": "safe" or "unsafe", "Response Safety": "safe" or "unsafe"}\n\nContent: ${text}`
        }],
        max_tokens: 100,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      return { isSafe: true, userSafety: 'safe', responseSafety: 'safe' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isSafe: parsed['User Safety'] === 'safe' && parsed['Response Safety'] === 'safe',
          userSafety: parsed['User Safety'] || 'safe',
          responseSafety: parsed['Response Safety'] || 'safe'
        };
      }
    } catch (e) {
      // Default to safe
    }

    return { isSafe: true, userSafety: 'safe', responseSafety: 'safe' };
  } catch (error) {
    return { isSafe: true, userSafety: 'safe', responseSafety: 'safe' };
  }
}
