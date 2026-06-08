/**
 * Orin AI — Model Benchmark Test
 * Tests NVIDIA NIM models for chat quality, tool calling, and speed.
 *
 * Usage: npx tsx __tests__/model-benchmark.ts
 * Or: npm run benchmark
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!NVIDIA_API_KEY) {
  console.error('ERROR: NVIDIA_API_KEY environment variable is required');
  process.exit(1);
}

// ============================================================
// Test Prompts
// ============================================================

const CHAT_PROMPT = {
  system: 'You are Orin, a helpful career coach AI. Be concise and actionable.',
  user: 'What are the top 3 skills I should learn in 2026 to get a software engineering job?',
  expectKeywords: ['skills', 'learn', '2026', 'engineering'],
};

const TOOL_CALL_PROMPT = {
  system: 'You are a helpful assistant with access to tools. Always use tools when needed.',
  user: 'What is the weather in New York?',
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'City name' },
            unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' },
          },
          required: ['location'],
        },
      },
    },
  ],
  expectToolCall: 'get_weather',
};

const REASONING_PROMPT = {
  system: 'You are a helpful assistant. Think step by step.',
  user: 'If I have 5 job applications pending and I get 2 new referrals, and each referral doubles my callback chance from 20% to 40%, how many total callbacks should I expect?',
  expectNumbers: [2, 0.4, 0.8],
};

// ============================================================
// Candidate Models (sorted by likely suitability)
// ============================================================

const CANDIDATE_MODELS = [
  // Qwen — top tier
  'qwen/qwen3.5-397b-a17b',
  'qwen/qwen3-coder-480b-a35b-instruct',
  'qwen/qwen3.5-122b-a10b',
  'qwen/qwen3-next-80b-a3b-instruct',
  // NVIDIA Nemotron — agent power
  'nvidia/nemotron-3-ultra-550b-a55b',
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/nemotron-3-nano-30b-a3b',
  'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  // Meta Llama
  'meta/llama-4-maverick-17b-128e-instruct',
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.2-3b-instruct',
  // DeepSeek
  'deepseek-ai/deepseek-v4-pro',
  'deepseek-ai/deepseek-v4-flash',
  // Mistral
  'mistralai/mistral-large-3-675b-instruct-2512',
  'mistralai/mistral-medium-3.5-128b',
  'mistralai/mistral-small-4-119b-2603',
  // Google
  'google/gemma-4-31b-it',
  'google/gemma-3-12b-it',
  'google/gemma-3-4b-it',
  // MiniMax
  'minimaxai/minimax-m2.7',
  // Moonshot
  'moonshotai/kimi-k2.6',
  // Z.AI
  'z-ai/glm-5.1',
  // OpenAI OSS
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  // StepFun
  'stepfun-ai/step-3.7-flash',
];

// ============================================================
// Benchmark Runner
// ============================================================

interface BenchmarkResult {
  model: string;
  chat: {
    success: boolean;
    latencyMs: number;
    responseLength: number;
    qualityScore: number;
    error?: string;
  };
  toolCall: {
    success: boolean;
    latencyMs: number;
    calledCorrectTool: boolean;
    error?: string;
  };
  reasoning: {
    success: boolean;
    latencyMs: number;
    responseLength: number;
    error?: string;
  };
  overallScore: number;
}

async function callNvidia(
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    tools?: any[];
    temperature?: number;
    max_tokens?: number;
    timeoutMs?: number;
  } = {}
): Promise<{ response: any; latencyMs: number }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 60000);

  try {
    const body: any = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 500,
    };
    if (options.tools) {
      body.tools = options.tools;
      body.tool_choice = 'auto';
    }

    const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return { response: data, latencyMs };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Timeout after 60s');
    }
    throw err;
  }
}

async function benchmarkChat(model: string): Promise<BenchmarkResult['chat']> {
  try {
    const { response, latencyMs } = await callNvidia(model, [
      { role: 'system', content: CHAT_PROMPT.system },
      { role: 'user', content: CHAT_PROMPT.user },
    ], { max_tokens: 300, timeoutMs: 45000 });

    const content = response.choices?.[0]?.message?.content || '';
    const lowerContent = content.toLowerCase();

    // Quality score based on keyword coverage and length
    let qualityScore = 0;
    for (const kw of CHAT_PROMPT.expectKeywords) {
      if (lowerContent.includes(kw)) qualityScore += 25;
    }
    if (content.length > 100) qualityScore += 10;
    if (content.length > 300) qualityScore += 10;

    return {
      success: true,
      latencyMs,
      responseLength: content.length,
      qualityScore: Math.min(100, qualityScore),
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: 0,
      responseLength: 0,
      qualityScore: 0,
      error: err.message,
    };
  }
}

async function benchmarkToolCall(model: string): Promise<BenchmarkResult['toolCall']> {
  try {
    const { response, latencyMs } = await callNvidia(model, [
      { role: 'system', content: TOOL_CALL_PROMPT.system },
      { role: 'user', content: TOOL_CALL_PROMPT.user },
    ], {
      tools: TOOL_CALL_PROMPT.tools,
      max_tokens: 300,
      timeoutMs: 45000,
    });

    const message = response.choices?.[0]?.message;
    const toolCalls = message?.tool_calls || [];
    const calledCorrectTool = toolCalls.some(
      (tc: any) => tc.function?.name === TOOL_CALL_PROMPT.expectToolCall
    );

    return {
      success: true,
      latencyMs,
      calledCorrectTool,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: 0,
      calledCorrectTool: false,
      error: err.message,
    };
  }
}

async function benchmarkReasoning(model: string): Promise<BenchmarkResult['reasoning']> {
  try {
    const { response, latencyMs } = await callNvidia(model, [
      { role: 'system', content: REASONING_PROMPT.system },
      { role: 'user', content: REASONING_PROMPT.user },
    ], { max_tokens: 300, timeoutMs: 45000 });

    const content = response.choices?.[0]?.message?.content || '';

    return {
      success: true,
      latencyMs,
      responseLength: content.length,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: 0,
      responseLength: 0,
      error: err.message,
    };
  }
}

function calculateOverallScore(result: BenchmarkResult): number {
  let score = 0;

  // Chat: 40% weight
  if (result.chat.success) {
    score += (result.chat.qualityScore / 100) * 40;
    // Speed bonus: under 5s = full, 5-15s = partial, >15s = penalty
    if (result.chat.latencyMs < 5000) score += 10;
    else if (result.chat.latencyMs < 15000) score += 5;
  }

  // Tool calling: 40% weight
  if (result.toolCall.success) {
    score += 20; // Base for succeeding
    if (result.toolCall.calledCorrectTool) score += 20;
    // Speed bonus
    if (result.toolCall.latencyMs < 5000) score += 5;
    else if (result.toolCall.latencyMs < 15000) score += 2;
  }

  // Reasoning: 20% weight
  if (result.reasoning.success) {
    score += 10; // Base for succeeding
    if (result.reasoning.responseLength > 100) score += 5;
    if (result.reasoning.responseLength > 300) score += 5;
  }

  return Math.round(score);
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           ORIN AI — Model Benchmark Test                ║');
  console.log('║     Testing NVIDIA NIM models for chat & tool calling   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nTesting ${CANDIDATE_MODELS.length} models...\n`);

  const results: BenchmarkResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    const progress = `[${i + 1}/${CANDIDATE_MODELS.length}]`;

    process.stdout.write(`${progress} Testing ${model}...`);

    const chat = await benchmarkChat(model);
    process.stdout.write(' chat');

    const toolCall = await benchmarkToolCall(model);
    process.stdout.write(' tools');

    const reasoning = await benchmarkReasoning(model);
    process.stdout.write(' reason');

    const overallScore = calculateOverallScore({ model, chat, toolCall, reasoning, overallScore: 0 });

    results.push({ model, chat, toolCall, reasoning, overallScore });

    const status = overallScore > 50 ? '✓' : overallScore > 20 ? '~' : '✗';
    console.log(` → ${status} Score: ${overallScore}/100 (${chat.latencyMs}ms chat, ${toolCall.latencyMs}ms tools)`);

    // Small delay to avoid rate limiting
    if (i < CANDIDATE_MODELS.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Sort by score
  results.sort((a, b) => b.overallScore - a.overallScore);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTS SUMMARY                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`Total time: ${totalTime}s\n`);

  // Top 10
  console.log('Top 10 Models:');
  console.log('─'.repeat(80));
  console.log(`${'Rank'.padEnd(5)} ${'Model'.padEnd(45)} ${'Score'.padEnd(7)} ${'Chat ms'.padEnd(10)} ${'Tools'.padEnd(8)} ${'TC OK'.padEnd(6)}`);
  console.log('─'.repeat(80));

  results.slice(0, 10).forEach((r, i) => {
    const rank = `${i + 1}.`.padEnd(5);
    const model = r.model.padEnd(45);
    const score = `${r.overallScore}`.padEnd(7);
    const chatMs = r.chat.success ? `${r.chat.latencyMs}`.padEnd(10) : 'FAIL'.padEnd(10);
    const toolsMs = r.toolCall.success ? `${r.toolCall.latencyMs}`.padEnd(8) : 'FAIL'.padEnd(8);
    const tcOk = r.toolCall.calledCorrectTool ? 'YES'.padEnd(6) : 'NO'.padEnd(6);
    console.log(`${rank} ${model} ${score} ${chatMs} ${toolsMs} ${tcOk}`);
  });

  // Tool calling champions
  const tcChampions = results.filter(r => r.toolCall.calledCorrectTool);
  console.log(`\nTool Calling Champions: ${tcChampions.length}/${results.length} models`);

  // Fastest models (that work)
  const working = results.filter(r => r.chat.success && r.toolCall.success);
  working.sort((a, b) => a.chat.latencyMs - b.chat.latencyMs);
  if (working.length > 0) {
    console.log('\nFastest Models (chat + tools working):');
    working.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.model} — ${r.chat.latencyMs}ms chat, ${r.toolCall.latencyMs}ms tools`);
    });
  }

  // Save results
  const outputPath = join(__dirname, 'benchmark-results.json');
  const output = {
    timestamp: new Date().toISOString(),
    totalTimeMs: Date.now() - startTime,
    results: results.map(r => ({
      model: r.model,
      score: r.overallScore,
      chat: { success: r.chat.success, latencyMs: r.chat.latencyMs, quality: r.chat.qualityScore, error: r.chat.error },
      toolCall: { success: r.toolCall.success, latencyMs: r.toolCall.latencyMs, correctTool: r.toolCall.calledCorrectTool, error: r.toolCall.error },
      reasoning: { success: r.reasoning.success, latencyMs: r.reasoning.latencyMs, length: r.reasoning.responseLength, error: r.reasoning.error },
    })),
    recommendation: {
      bestOverall: results[0]?.model,
      bestForToolCalling: tcChampions[0]?.model,
      fastestReliable: working[0]?.model,
      bestQuality: results.find(r => r.chat.qualityScore >= 80)?.model,
    },
  };

  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  // Print recommendation
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  RECOMMENDATION                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Best Overall:       ${output.recommendation.bestOverall}`);
  console.log(`  Best Tool Calling:  ${output.recommendation.bestForToolCalling}`);
  console.log(`  Fastest Reliable:   ${output.recommendation.fastestReliable}`);
  console.log(`  Best Quality:       ${output.recommendation.bestQuality}`);
}

main().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
