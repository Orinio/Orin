import { describe, it, expect } from 'vitest';
import { AI_RATE_LIMITS, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiting Configuration', () => {
  describe('AI_RATE_LIMITS', () => {
    it('has config for ai-verify', () => {
      const config = AI_RATE_LIMITS['ai-verify'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(10);
      expect(config.maxPerWeek).toBe(50);
      expect(config.cooldownHours).toBe(0.5);
    });

    it('has config for ai-chat', () => {
      const config = AI_RATE_LIMITS['ai-chat'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(30);
      expect(config.maxPerWeek).toBe(150);
    });

    it('has config for ai-match-opportunities', () => {
      const config = AI_RATE_LIMITS['ai-match-opportunities'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(5);
      expect(config.maxPerWeek).toBe(20);
    });

    it('has config for ai-skills', () => {
      const config = AI_RATE_LIMITS['ai-skills'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(10);
    });

    it('has config for coach-notes-generate', () => {
      const config = AI_RATE_LIMITS['coach-notes-generate'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(3);
      expect(config.cooldownHours).toBe(4);
    });

    it('all configs have positive limits', () => {
      Object.values(AI_RATE_LIMITS).forEach((config) => {
        expect(config.maxPerDay).toBeGreaterThan(0);
        expect(config.maxPerWeek).toBeGreaterThan(0);
        expect(config.cooldownHours).toBeGreaterThan(0);
      });
    });

    it('weekly limits are >= daily limits', () => {
      Object.values(AI_RATE_LIMITS).forEach((config) => {
        expect(config.maxPerWeek).toBeGreaterThanOrEqual(config.maxPerDay);
      });
    });
  });

  describe('RATE_LIMITS (coach notes)', () => {
    it('has config for daily notes', () => {
      const config = RATE_LIMITS['daily'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(1);
      expect(config.maxPerWeek).toBe(7);
    });

    it('has config for weekly notes', () => {
      const config = RATE_LIMITS['weekly'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(0);
      expect(config.maxPerWeek).toBe(1);
      expect(config.cooldownHours).toBe(168);
    });

    it('has config for milestone notes', () => {
      const config = RATE_LIMITS['milestone'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(3);
    });

    it('has config for ad_hoc notes', () => {
      const config = RATE_LIMITS['ad_hoc'];
      expect(config).toBeDefined();
      expect(config.maxPerDay).toBe(2);
      expect(config.maxPerWeek).toBe(14);
    });

    it('all configs have valid structure', () => {
      Object.values(RATE_LIMITS).forEach((config) => {
        expect(typeof config.maxPerDay).toBe('number');
        expect(typeof config.maxPerWeek).toBe('number');
        expect(typeof config.cooldownHours).toBe('number');
        expect(config.maxPerDay).toBeGreaterThanOrEqual(0);
        expect(config.maxPerWeek).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
