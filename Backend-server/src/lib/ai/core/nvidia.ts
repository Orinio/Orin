import { logger } from '../../logger.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function isNvidiaConfigured(): boolean {
  return !!NVIDIA_API_KEY;
}

export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY not configured');
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 500,
      stream: options.stream ?? false,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    logger.error({ status: response.status, error: errorText }, 'NVIDIA NIM API error');
    throw new Error(`NVIDIA NIM API error: ${response.status}`);
  }

  return response.json() as Promise<ChatCompletionResponse>;
}

export async function* chatCompletionStream(
  options: ChatCompletionOptions
): AsyncGenerator<string, void, unknown> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY not configured');
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 500,
      stream: true,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    logger.error({ status: response.status, error: errorText }, 'NVIDIA NIM API stream error');
    throw new Error(`NVIDIA NIM API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Skip invalid JSON chunks
        }
      }
    }
  }
}

export async function generateEmbeddings(
  text: string,
  model: string = 'nvidia/nv-embed-v1'
): Promise<{ embedding: number[]; dimensions: number; tokensUsed: number }> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY not configured');
  }

  const response = await fetch(`${NVIDIA_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({ model, input: text }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return {
    embedding: data.data?.[0]?.embedding || [],
    dimensions: data.data?.[0]?.embedding?.length || 0,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}
