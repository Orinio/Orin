/**
 * Shared utilities for AI agent output processing
 */

const BLOCKED_PATTERNS = [
  /api[_-]?key[:\s]*[A-Za-z0-9_-]{20,}/gi,
  /secret[:\s]*[A-Za-z0-9_-]{20,}/gi,
  /password[:\s]+\S+/gi,
  /Bearer\s+[A-Za-z0-9._-]{20,}/gi,
  /nvapi-[A-Za-z0-9_-]{20,}/gi,
];

export function sanitizeAnswer(answer: string): string {
  let sanitized = answer;
  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export function extractJSON<T = any>(content: string): T | null {
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* continue */ }

  // Strategy 2: Find JSON block in markdown
  const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') return parsed;
    } catch { /* continue */ }
  }

  // Strategy 3: Find first complete JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch { /* continue */ }
  }

  return null;
}
