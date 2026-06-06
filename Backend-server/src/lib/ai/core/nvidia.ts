import { logger } from '../../logger.js';
import { AppError, Errors } from '../../app-error.js';
import { getRequestId } from '../../request-context.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 2000;

// ---- Model Fallback Chain ----
// When primary model is unavailable (rate limited, overloaded), try fallbacks.
// Ordered by capability: best → acceptable → emergency.
const MODEL_FALLBACKS: Record<string, string[]> = {
  'nvidia/llama-3.3-nemotron-super-49b-v1': [
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'meta/llama-3.1-8b-instruct',
  ],
  'nvidia/llama-3.1-nemotron-70b-instruct': [
    'meta/llama-3.1-8b-instruct',
  ],
  'meta/llama-3.1-8b-instruct': [],
};

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

// ---- Global token tracking (for observability) ----
const tokenUsage = { prompt: 0, completion: 0, total: 0, requests: 0, errors: 0 };

export function getTokenUsage() {
  return { ...tokenUsage };
}

export function isNvidiaConfigured(): boolean {
  return !!NVIDIA_API_KEY;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries: number = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  // Inject request ID for distributed tracing
  const requestId = getRequestId();
  const headers = new Headers(init.headers);
  if (requestId) {
    headers.set('X-Request-Id', requestId);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      logger.warn({ attempt, delayMs, url }, 'Retrying NVIDIA API call');
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    try {
      const response = await fetch(url, { ...init, headers });

      // Don't retry 429 (rate limited) or 4xx (client errors)
      if (response.status === 429) {
        const errorText = await response.text().catch(() => 'Rate limited');
        throw new AppError('RATE_LIMITED', `NVIDIA NIM rate limited: ${errorText}`, 429);
      }

      if (response.status >= 400 && response.status < 500) {
        const errorText = await response.text().catch(() => 'Client error');
        throw new AppError('EXTERNAL_SERVICE_ERROR', `NVIDIA NIM client error ${response.status}: ${errorText}`, 502, { status: response.status });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Server error');
        lastError = new AppError('EXTERNAL_SERVICE_ERROR', `NVIDIA NIM server error ${response.status}: ${errorText}`, 502, { status: response.status });
        continue; // Retry on 5xx
      }

      return response;
    } catch (err) {
      if (err instanceof AppError && err.code === 'RATE_LIMITED') throw err;
      if (err instanceof AppError && err.code === 'EXTERNAL_SERVICE_ERROR') {
        lastError = err;
        continue; // Retry server errors
      }
      throw err; // Throw network/timeout errors immediately
    }
  }

  throw lastError || Errors.externalServiceError('NVIDIA NIM', undefined);
}

export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResponse> {
  if (!NVIDIA_API_KEY) {
    throw Errors.notConfigured('NVIDIA_API_KEY');
  }

  const modelsToTry = [options.model, ...(MODEL_FALLBACKS[options.model] || [])];

  for (const model of modelsToTry) {
    try {
      const response = await fetchWithRetry(
        `${NVIDIA_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${NVIDIA_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 500,
            stream: options.stream ?? false,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

      const result = await response.json() as ChatCompletionResponse;

      // Track token usage
      if (result.usage) {
        tokenUsage.prompt += result.usage.prompt_tokens;
        tokenUsage.completion += result.usage.completion_tokens;
        tokenUsage.total += result.usage.total_tokens;
      }
      tokenUsage.requests++;

      if (model !== options.model) {
        logger.warn({ originalModel: options.model, fallbackModel: model }, 'Used fallback model');
      }

      return result;
    } catch (err) {
      if (err instanceof AppError && err.code === 'RATE_LIMITED' && model !== options.model) {
        // Try next fallback model
        logger.warn({ failedModel: model, nextFallback: modelsToTry[modelsToTry.indexOf(model) + 1] }, 'Model rate limited, trying fallback');
        continue;
      }
      throw err;
    }
  }

  throw Errors.externalServiceError('NVIDIA NIM', undefined);
}

export async function* chatCompletionStream(
  options: ChatCompletionOptions
): AsyncGenerator<string, void, unknown> {
  if (!NVIDIA_API_KEY) {
    throw Errors.notConfigured('NVIDIA_API_KEY');
  }

  const modelsToTry = [options.model, ...(MODEL_FALLBACKS[options.model] || [])];

  for (const model of modelsToTry) {
    try {
      const response = await fetchWithRetry(
        `${NVIDIA_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${NVIDIA_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 500,
            stream: true,
          }),
          signal: AbortSignal.timeout(30000),
        },
      );

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

      return; // Success — don't try fallbacks
    } catch (err) {
      if (err instanceof AppError && err.code === 'RATE_LIMITED' && model !== modelsToTry[modelsToTry.length - 1]) {
        logger.warn({ failedModel: model }, 'Stream model rate limited, trying fallback');
        continue;
      }
      throw err;
    }
  }
}

export async function generateEmbeddings(
  text: string,
  model: string = 'nvidia/nv-embed-v1'
): Promise<{ embedding: number[]; dimensions: number; tokensUsed: number }> {
  if (!NVIDIA_API_KEY) {
    throw Errors.notConfigured('NVIDIA_API_KEY');
  }

  const response = await fetchWithRetry(
    `${NVIDIA_BASE_URL}/embeddings`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({ model, input: text }),
      signal: AbortSignal.timeout(15000),
    },
  );

  const data = await response.json() as any;
  return {
    embedding: data.data?.[0]?.embedding || [],
    dimensions: data.data?.[0]?.embedding?.length || 0,
    tokensUsed: data.usage?.total_tokens || 0,
  };
}
