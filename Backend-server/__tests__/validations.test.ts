import { describe, it, expect } from 'vitest';
import {
  validateRequest,
  chatStreamSchema,
  matchRequestSchema,
  safetyCheckSchema,
  chatMessageSchema,
  verifyRequestSchema,
  signInSchema,
} from '../src/lib/validations.js';

describe('Validation Schemas', () => {
  describe('chatStreamSchema', () => {
    it('should accept valid message', () => {
      const result = validateRequest(chatStreamSchema, { message: 'Hello' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Hello');
        expect(result.data.history).toEqual([]);
      }
    });

    it('should reject empty message', () => {
      const result = validateRequest(chatStreamSchema, { message: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing message', () => {
      const result = validateRequest(chatStreamSchema, {});
      expect(result.success).toBe(false);
    });

    it('should accept message with history', () => {
      const result = validateRequest(chatStreamSchema, {
        message: 'Hello',
        history: [{ role: 'user', content: 'Hi' }],
      });
      expect(result.success).toBe(true);
    });

    it('should reject history with invalid role', () => {
      const result = validateRequest(chatStreamSchema, {
        message: 'Hello',
        history: [{ role: 'invalid', content: 'Hi' }],
      });
      expect(result.success).toBe(false);
    });

    it('should cap history at 10 items', () => {
      const history = Array.from({ length: 15 }, (_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`,
      }));
      const result = validateRequest(chatStreamSchema, {
        message: 'Hello',
        history,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('matchRequestSchema', () => {
    it('should accept valid limit', () => {
      const result = validateRequest(matchRequestSchema, { limit: 10 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should default limit to 10', () => {
      const result = validateRequest(matchRequestSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit > 50', () => {
      const result = validateRequest(matchRequestSchema, { limit: 51 });
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = validateRequest(matchRequestSchema, { limit: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe('safetyCheckSchema', () => {
    it('should accept valid URL', () => {
      const result = validateRequest(safetyCheckSchema, { url: 'https://example.com' });
      expect(result.success).toBe(true);
    });

    it('should accept valid email', () => {
      const result = validateRequest(safetyCheckSchema, { email: 'test@example.com' });
      expect(result.success).toBe(true);
    });

    it('should accept both url and email', () => {
      const result = validateRequest(safetyCheckSchema, {
        url: 'https://example.com',
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (optional fields)', () => {
      const result = validateRequest(safetyCheckSchema, {});
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = validateRequest(safetyCheckSchema, { url: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = validateRequest(safetyCheckSchema, { email: 'not-an-email' });
      expect(result.success).toBe(false);
    });
  });

  describe('chatMessageSchema', () => {
    it('should accept valid message', () => {
      const result = validateRequest(chatMessageSchema, { message: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = validateRequest(chatMessageSchema, { message: '' });
      expect(result.success).toBe(false);
    });

    it('should reject message > 2000 chars', () => {
      const result = validateRequest(chatMessageSchema, {
        message: 'x'.repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('verifyRequestSchema', () => {
    it('should accept valid verify action with proofUrl', () => {
      const result = validateRequest(verifyRequestSchema, {
        action: 'verify',
        proofUrl: 'https://github.com/user/repo',
        sourceType: 'github',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid analyze action with proofData', () => {
      const result = validateRequest(verifyRequestSchema, {
        action: 'analyze',
        proofData: {
          title: 'Test Project',
          sourceType: 'github',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = validateRequest(verifyRequestSchema, {
        action: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should accept valid credentials', () => {
      const result = validateRequest(signInSchema, {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = validateRequest(signInSchema, {
        email: 'test@example.com',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = validateRequest(signInSchema, {
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });
});
