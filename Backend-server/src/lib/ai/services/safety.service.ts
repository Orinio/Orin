/**
 * Orin AI - Safety Service
 * Uses NVIDIA NeMo Guard models for content moderation
 */

import { NVIDIA_CONFIG, MODELS } from '../core/models.js';
import { logger } from '../../logger.js';

export interface SafetyCheckResult {
  isSafe: boolean;
  userSafety: 'safe' | 'unsafe';
  responseSafety: 'safe' | 'unsafe';
  categories: string[];
  confidence: number;
}

export interface PIIDetectionResult {
  hasPII: boolean;
  entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    score: number;
  }>;
  taggedText: string;
}

export interface TopicCheckResult {
  isOnTopic: boolean;
  topic: string;
  confidence: number;
}

/**
 * Check content safety using NeMo Guard
 */
export async function checkContentSafety(
  userMessage: string,
  aiResponse?: string,
  model: string = MODELS.safety.content
): Promise<SafetyCheckResult> {
  if (!NVIDIA_CONFIG.isConfigured) {
    return {
      isSafe: true,
      userSafety: 'safe',
      responseSafety: 'safe',
      categories: [],
      confidence: 0
    };
  }

  const startTime = Date.now();

  try {
    const contentToCheck = aiResponse 
      ? `User: ${userMessage}\nResponse: ${aiResponse}`
      : userMessage;

    const response = await fetch(`${NVIDIA_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: `Check if this content is safe. Return JSON: {"User Safety": "safe" or "unsafe", "Response Safety": "safe" or "unsafe"}\n\nContent: ${contentToCheck}`
        }],
        max_tokens: 100,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Safety check failed');
      return {
        isSafe: true,
        userSafety: 'safe',
        responseSafety: 'safe',
        categories: [],
        confidence: 0
      };
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';

    // Parse safety result
    let userSafety: 'safe' | 'unsafe' = 'safe';
    let responseSafety: 'safe' | 'unsafe' = 'safe';

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        userSafety = parsed['User Safety'] || 'safe';
        responseSafety = parsed['Response Safety'] || 'safe';
      }
    } catch (e) {
      // Default to safe if parsing fails
    }

    const isSafe = userSafety === 'safe' && responseSafety === 'safe';

    logger.info({
      model,
      isSafe,
      userSafety,
      responseSafety,
      durationMs: Date.now() - startTime
    }, 'Content safety checked');

    return {
      isSafe,
      userSafety,
      responseSafety,
      categories: isSafe ? [] : ['potentially_unsafe'],
      confidence: isSafe ? 0.9 : 0.7
    };
  } catch (error) {
    logger.error({ error, model }, 'Safety check error');
    // Fail open - allow content if safety check fails
    return {
      isSafe: true,
      userSafety: 'safe',
      responseSafety: 'safe',
      categories: [],
      confidence: 0
    };
  }
}

/**
 * Detect PII in text
 */
export async function detectPII(
  text: string,
  model: string = MODELS.safety.pii
): Promise<PIIDetectionResult> {
  if (!NVIDIA_CONFIG.isConfigured) {
    return {
      hasPII: false,
      entities: [],
      taggedText: text
    };
  }

  try {
    const response = await fetch(`${NVIDIA_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: text
        }],
        max_tokens: 500,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return {
        hasPII: false,
        entities: [],
        taggedText: text
      };
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';

    // Parse PII result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          hasPII: (parsed.total_entities || 0) > 0,
          entities: parsed.entities || [],
          taggedText: parsed.tagged_text || text
        };
      }
    } catch (e) {
      // Fallback
    }

    return {
      hasPII: false,
      entities: [],
      taggedText: text
    };
  } catch (error) {
    logger.error({ error, model }, 'PII detection error');
    return {
      hasPII: false,
      entities: [],
      taggedText: text
    };
  }
}

/**
 * Check if content is on-topic
 */
export async function checkTopic(
  text: string,
  _allowedTopics: string[] = ['career', 'jobs', 'skills', 'learning', 'portfolio', 'coding', 'development'],
  model: string = MODELS.safety.topic
): Promise<TopicCheckResult> {
  if (!NVIDIA_CONFIG.isConfigured) {
    return {
      isOnTopic: true,
      topic: 'general',
      confidence: 0.5
    };
  }

  try {
    const response = await fetch(`${NVIDIA_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: text
        }],
        max_tokens: 50,
        temperature: 0.1
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return {
        isOnTopic: true,
        topic: 'general',
        confidence: 0.5
      };
    }

    const data = await response.json() as any;
    const content = (data.choices?.[0]?.message?.content || '').toLowerCase().trim();

    const isOnTopic = content !== 'off-topic';

    return {
      isOnTopic,
      topic: isOnTopic ? 'career' : 'off-topic',
      confidence: isOnTopic ? 0.8 : 0.9
    };
  } catch (error) {
    logger.error({ error, model }, 'Topic check error');
    return {
      isOnTopic: true,
      topic: 'general',
      confidence: 0.5
    };
  }
}

/**
 * Sanitize user input before processing
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  let sanitized = input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Truncate if too long
  const MAX_LENGTH = 5000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
  }

  return sanitized;
}

/**
 * Sanitize AI response before sending to user
 */
export function sanitizeResponse(response: string): string {
  // Remove any API keys or secrets that might have leaked
  let sanitized = response;

  // Patterns to redact
  const patterns = [
    /api[_-]?key[:\s]*[A-Za-z0-9_-]{20,}/gi,
    /secret[:\s]*[A-Za-z0-9_-]{20,}/gi,
    /password[:\s]+\S+/gi,
    /Bearer\s+[A-Za-z0-9._-]{20,}/gi,
    /nvapi-[A-Za-z0-9_-]{20,}/gi
  ];

  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

/**
 * Full safety pipeline - check input and output
 */
export async function fullSafetyCheck(
  userInput: string,
  aiResponse?: string
): Promise<{
  inputSafe: boolean;
  outputSafe: boolean;
  piiDetected: boolean;
  sanitizedInput: string;
  sanitizedOutput?: string;
  details: {
    inputSafety: SafetyCheckResult;
    outputSafety?: SafetyCheckResult;
    pii?: PIIDetectionResult;
  };
}> {
  // Sanitize input
  const sanitizedInput = sanitizeInput(userInput);

  // Check input safety
  const inputSafety = await checkContentSafety(sanitizedInput);

  // Detect PII in input
  const pii = await detectPII(sanitizedInput);

  // Check output safety if provided
  let outputSafety: SafetyCheckResult | undefined;
  let sanitizedOutput: string | undefined;

  if (aiResponse) {
    sanitizedOutput = sanitizeResponse(aiResponse);
    outputSafety = await checkContentSafety(sanitizedInput, sanitizedOutput);
  }

  return {
    inputSafe: inputSafety.isSafe,
    outputSafe: outputSafety?.isSafe ?? true,
    piiDetected: pii.hasPII,
    sanitizedInput,
    sanitizedOutput,
    details: {
      inputSafety,
      outputSafety,
      pii
    }
  };
}
