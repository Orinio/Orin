"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenUsage = getTokenUsage;
exports.isNvidiaConfigured = isNvidiaConfigured;
exports.chatCompletion = chatCompletion;
exports.chatCompletionStream = chatCompletionStream;
exports.generateEmbeddings = generateEmbeddings;
const logger_js_1 = require("../../logger.js");
const app_error_js_1 = require("../../app-error.js");
const request_context_js_1 = require("../../request-context.js");
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1500;
const API_TIMEOUT_MS = 90000; // 90s for large models (397B+ params need more time)
// ---- Model Fallback Chain ----
// When primary model is unavailable (rate limited, overloaded), try fallbacks.
// Ordered by capability: best → acceptable → emergency.
const MODEL_FALLBACKS = {
    // GPT OSS 120B — primary for non-chat AI features
    'openai/gpt-oss-120b': [
        'qwen/qwen3.5-397b-a17b',
        'nvidia/llama-3.3-nemotron-super-49b-v1',
        'meta/llama-3.3-70b-instruct',
    ],
    // Qwen models — large, high quality
    'qwen/qwen3.5-397b-a17b': [
        'openai/gpt-oss-120b',
        'qwen/qwen3.5-122b-a10b',
        'nvidia/llama-3.3-nemotron-super-49b-v1',
        'meta/llama-3.3-70b-instruct',
    ],
    'qwen/qwen3-coder-480b-a35b-instruct': [
        'qwen/qwen3.5-397b-a17b',
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'meta/llama-3.3-70b-instruct',
    ],
    'qwen/qwen3.5-122b-a10b': [
        'nvidia/llama-3.3-nemotron-super-49b-v1',
        'meta/llama-3.3-70b-instruct',
        'meta/llama-3.1-70b-instruct',
    ],
    // NVIDIA Nemotron models
    'nvidia/llama-3.3-nemotron-super-49b-v1': [
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'meta/llama-3.3-70b-instruct',
        'meta/llama-3.1-8b-instruct',
    ],
    'nvidia/llama-3.1-nemotron-70b-instruct': [
        'meta/llama-3.3-70b-instruct',
        'meta/llama-3.1-8b-instruct',
    ],
    // Meta Llama models
    'meta/llama-3.3-70b-instruct': [
        'meta/llama-3.1-70b-instruct',
        'meta/llama-3.1-8b-instruct',
    ],
    'meta/llama-3.1-70b-instruct': [
        'meta/llama-3.1-8b-instruct',
        'nvidia/llama-3.1-nemotron-nano-8b-v1',
    ],
    'meta/llama-3.1-8b-instruct': [
        'nvidia/llama-3.1-nemotron-nano-8b-v1',
        'meta/llama-3.2-3b-instruct',
    ],
    // DeepSeek models
    'deepseek-ai/deepseek-v4-pro': [
        'deepseek-ai/deepseek-v4-flash',
        'qwen/qwen3.5-122b-a10b',
        'meta/llama-3.3-70b-instruct',
    ],
    'deepseek-ai/deepseek-v4-flash': [
        'qwen/qwen3.5-122b-a10b',
        'meta/llama-3.3-70b-instruct',
    ],
    // Mistral models
    'mistralai/mistral-large-3-675b-instruct-2512': [
        'mistralai/mistral-medium-3.5-128b',
        'meta/llama-3.3-70b-instruct',
    ],
    'mistralai/mistral-medium-3.5-128b': [
        'mistralai/mistral-small-4-119b-2603',
        'meta/llama-3.3-70b-instruct',
    ],
};
// ---- Global token tracking (for observability) ----
const tokenUsage = { prompt: 0, completion: 0, total: 0, requests: 0, errors: 0 };
function getTokenUsage() {
    return { ...tokenUsage };
}
function isNvidiaConfigured() {
    return !!NVIDIA_API_KEY;
}
async function fetchWithRetry(url, init, retries = MAX_RETRIES) {
    let lastError = null;
    // Inject request ID for distributed tracing
    const requestId = (0, request_context_js_1.getRequestId)();
    const headers = new Headers(init.headers);
    if (requestId) {
        headers.set('X-Request-Id', requestId);
    }
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            const delayMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
            logger_js_1.logger.warn({ attempt, delayMs, url }, 'Retrying NVIDIA API call');
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        try {
            const response = await fetch(url, { ...init, headers });
            // Don't retry 429 (rate limited) or 4xx (client errors)
            if (response.status === 429) {
                const errorText = await response.text().catch(() => 'Rate limited');
                throw new app_error_js_1.AppError('RATE_LIMITED', `NVIDIA NIM rate limited: ${errorText}`, 429);
            }
            if (response.status >= 400 && response.status < 500) {
                const errorText = await response.text().catch(() => 'Client error');
                throw new app_error_js_1.AppError('EXTERNAL_SERVICE_ERROR', `NVIDIA NIM client error ${response.status}: ${errorText}`, 502, { status: response.status });
            }
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Server error');
                lastError = new app_error_js_1.AppError('EXTERNAL_SERVICE_ERROR', `NVIDIA NIM server error ${response.status}: ${errorText}`, 502, { status: response.status });
                continue; // Retry on 5xx
            }
            return response;
        }
        catch (err) {
            if (err instanceof app_error_js_1.AppError && err.code === 'RATE_LIMITED')
                throw err;
            // Retry on timeout, network, and server errors
            if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError' || err.message?.includes('timeout'))) {
                lastError = new app_error_js_1.AppError('EXTERNAL_SERVICE_ERROR', `NVIDIA NIM timeout: ${err.message}`, 504);
                continue;
            }
            if (err instanceof app_error_js_1.AppError && err.code === 'EXTERNAL_SERVICE_ERROR') {
                lastError = err;
                continue; // Retry server errors
            }
            throw err; // Throw unexpected errors immediately
        }
    }
    throw lastError || app_error_js_1.Errors.externalServiceError('NVIDIA NIM', undefined);
}
async function chatCompletion(options) {
    if (!NVIDIA_API_KEY) {
        throw app_error_js_1.Errors.notConfigured('NVIDIA_API_KEY');
    }
    const modelsToTry = [options.model, ...(MODEL_FALLBACKS[options.model] || [])];
    for (const model of modelsToTry) {
        try {
            const response = await fetchWithRetry(`${NVIDIA_BASE_URL}/chat/completions`, {
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
                    ...(options.tools && options.tools.length > 0 ? { tools: options.tools, tool_choice: options.tool_choice ?? 'auto' } : {}),
                }),
                signal: AbortSignal.timeout(options.timeoutMs ?? API_TIMEOUT_MS),
            });
            const result = await response.json();
            // Track token usage
            if (result.usage) {
                tokenUsage.prompt += result.usage.prompt_tokens;
                tokenUsage.completion += result.usage.completion_tokens;
                tokenUsage.total += result.usage.total_tokens;
            }
            tokenUsage.requests++;
            if (model !== options.model) {
                logger_js_1.logger.warn({ originalModel: options.model, fallbackModel: model }, 'Used fallback model');
            }
            return result;
        }
        catch (err) {
            if (err instanceof app_error_js_1.AppError && err.code === 'RATE_LIMITED' && model !== options.model) {
                // Try next fallback model
                logger_js_1.logger.warn({ failedModel: model, nextFallback: modelsToTry[modelsToTry.indexOf(model) + 1] }, 'Model rate limited, trying fallback');
                continue;
            }
            throw err;
        }
    }
    throw app_error_js_1.Errors.externalServiceError('NVIDIA NIM', undefined);
}
async function* chatCompletionStream(options) {
    if (!NVIDIA_API_KEY) {
        throw app_error_js_1.Errors.notConfigured('NVIDIA_API_KEY');
    }
    const modelsToTry = [options.model, ...(MODEL_FALLBACKS[options.model] || [])];
    for (const model of modelsToTry) {
        try {
            const response = await fetchWithRetry(`${NVIDIA_BASE_URL}/chat/completions`, {
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
                signal: AbortSignal.timeout(options.timeoutMs ?? API_TIMEOUT_MS),
            });
            const reader = response.body?.getReader();
            if (!reader)
                throw new Error('No response stream');
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]')
                            return;
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content)
                                yield content;
                        }
                        catch {
                            // Skip invalid JSON chunks
                        }
                    }
                }
            }
            return; // Success — don't try fallbacks
        }
        catch (err) {
            if (err instanceof app_error_js_1.AppError && err.code === 'RATE_LIMITED' && model !== modelsToTry[modelsToTry.length - 1]) {
                logger_js_1.logger.warn({ failedModel: model }, 'Stream model rate limited, trying fallback');
                continue;
            }
            throw err;
        }
    }
}
async function generateEmbeddings(text, model = 'nvidia/nv-embed-v1') {
    if (!NVIDIA_API_KEY) {
        throw app_error_js_1.Errors.notConfigured('NVIDIA_API_KEY');
    }
    const response = await fetchWithRetry(`${NVIDIA_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({ model, input: text }),
        signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    return {
        embedding: data.data?.[0]?.embedding || [],
        dimensions: data.data?.[0]?.embedding?.length || 0,
        tokensUsed: data.usage?.total_tokens || 0,
    };
}
//# sourceMappingURL=nvidia.js.map