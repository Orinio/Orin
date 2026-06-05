import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  usernameSchema,
  uuidSchema,
  urlSchema,
  signInSchema,
  signUpSchema,
  createProofSchema,
  chatMessageSchema,
  verifyRequestSchema,
  validateRequest,
} from '@/lib/validations';

describe('Email Schema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(emailSchema.safeParse('').success).toBe(false);
  });
});

describe('Username Schema', () => {
  it('accepts valid username', () => {
    expect(usernameSchema.safeParse('john-doe').success).toBe(true);
    expect(usernameSchema.safeParse('user_123').success).toBe(true);
  });

  it('rejects invalid username', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false); // too short
    expect(usernameSchema.safeParse('john doe').success).toBe(false); // space
    expect(usernameSchema.safeParse('john@doe').success).toBe(false); // special char
  });
});

describe('UUID Schema', () => {
  it('accepts valid UUID', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('URL Schema', () => {
  it('accepts valid URL', () => {
    expect(urlSchema.safeParse('https://example.com').success).toBe(true);
  });

  it('rejects invalid URL', () => {
    expect(urlSchema.safeParse('not-a-url').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(urlSchema.safeParse('').success).toBe(false);
  });
});

describe('Sign In Schema', () => {
  it('accepts valid sign in data', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('Sign Up Schema', () => {
  it('accepts valid sign up data', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      fullName: 'John Doe',
      username: 'johndoe',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal sign up data', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });
});

describe('Create Proof Schema', () => {
  it('accepts valid proof data', () => {
    const result = createProofSchema.safeParse({
      title: 'My GitHub Project',
      sourceType: 'github',
      sourceUrl: 'https://github.com/user/repo',
      skillsExtracted: ['JavaScript', 'React'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createProofSchema.safeParse({
      sourceType: 'github',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source type', () => {
    const result = createProofSchema.safeParse({
      title: 'Test',
      sourceType: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('Chat Message Schema', () => {
  it('accepts valid chat message', () => {
    const result = chatMessageSchema.safeParse({
      message: 'What skills should I learn?',
    });
    expect(result.success).toBe(true);
  });

  it('accepts message with history', () => {
    const result = chatMessageSchema.safeParse({
      message: 'Tell me more',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty message', () => {
    const result = chatMessageSchema.safeParse({
      message: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects too long message', () => {
    const result = chatMessageSchema.safeParse({
      message: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

describe('Verify Request Schema', () => {
  it('accepts valid verify request', () => {
    const result = verifyRequestSchema.safeParse({
      action: 'verify',
      proofUrl: 'https://github.com/user/repo',
      sourceType: 'github',
    });
    expect(result.success).toBe(true);
  });

  it('accepts analyze request', () => {
    const result = verifyRequestSchema.safeParse({
      action: 'analyze',
      proofData: {
        title: 'Test Proof',
        sourceType: 'github',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid action', () => {
    const result = verifyRequestSchema.safeParse({
      action: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateRequest helper', () => {
  it('returns success for valid data', () => {
    const result = validateRequest(emailSchema, 'user@example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('returns error for invalid data', () => {
    const result = validateRequest(emailSchema, 'not-email');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Invalid email');
    }
  });
});
