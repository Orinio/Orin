import { describe, it, expect } from 'vitest';

// Test the extractJSON logic by importing it indirectly
// We test the behavior through the agent-runner's JSON parsing patterns

describe('Agent-runner JSON extraction patterns', () => {
  // These tests validate the JSON extraction strategies used in agent-runner

  function extractJSON(content: string): Record<string, unknown> | null {
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

  it('should parse direct JSON', () => {
    const input = '{"answer": "Hello world", "thinking": "test"}';
    const result = extractJSON(input);
    expect(result).toEqual({ answer: 'Hello world', thinking: 'test' });
  });

  it('should parse JSON in markdown code block', () => {
    const input = 'Here is my response:\n```json\n{"answer": "Found it", "thinking": "parsed"}\n```';
    const result = extractJSON(input);
    expect(result).toEqual({ answer: 'Found it', thinking: 'parsed' });
  });

  it('should parse JSON in plain code block', () => {
    const input = 'Response:\n```\n{"answer": "Works too"}\n```';
    const result = extractJSON(input);
    expect(result).toEqual({ answer: 'Works too' });
  });

  it('should extract JSON from mixed text', () => {
    const input = 'Based on my analysis, here is the result: {"answer": "The score is 85", "thinking": "calculated"} and that concludes my review.';
    const result = extractJSON(input);
    expect(result).toEqual({ answer: 'The score is 85', thinking: 'calculated' });
  });

  it('should return null for no JSON', () => {
    const input = 'This is just plain text with no JSON at all.';
    const result = extractJSON(input);
    expect(result).toBeNull();
  });

  it('should handle tool_call responses', () => {
    const input = '{"tool_call": {"name": "verify_github_repo", "arguments": {"username": "test"}}}';
    const result = extractJSON(input);
    expect(result).toEqual({
      tool_call: { name: 'verify_github_repo', arguments: { username: 'test' } },
    });
  });

  it('should handle nested JSON', () => {
    const input = '{"answer": "result", "metadata": {"tokens": 100, "model": "test"}}';
    const result = extractJSON(input);
    expect(result).toEqual({
      answer: 'result',
      metadata: { tokens: 100, model: 'test' },
    });
  });
});

describe('Answer sanitization patterns', () => {
  function sanitizeAnswer(answer: string): string {
    const BLOCKED_PATTERNS = [
      /api[_-]?key[:\s]*[A-Za-z0-9_-]{20,}/i,
      /secret[:\s]*[A-Za-z0-9_-]{20,}/i,
      /password[:\s]+\S+/i,
      /Bearer\s+[A-Za-z0-9._-]{20,}/i,
    ];
    let sanitized = answer;
    for (const pattern of BLOCKED_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }

  it('should redact API keys', () => {
    const input = 'The api_key:nv-abc123def456ghi789jkl012mno was exposed';
    expect(sanitizeAnswer(input)).toContain('[REDACTED]');
  });

  it('should redact Bearer tokens', () => {
    const input = 'Authorization: Bearer nv-abc123def456ghi789jkl012mno';
    expect(sanitizeAnswer(input)).toContain('[REDACTED]');
  });

  it('should not redact short strings', () => {
    const input = 'The key is abc';
    expect(sanitizeAnswer(input)).toBe(input);
  });

  it('should not redact normal text', () => {
    const input = 'This is a normal response about JavaScript development.';
    expect(sanitizeAnswer(input)).toBe(input);
  });
});
