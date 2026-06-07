import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const chatQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(4000, 'Query too long'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).max(50).optional(),
  agentId: z.string().optional(),
});

export const streamChatSchema = z.object({
  query: z.string().min(1, 'Query is required').max(4000, 'Query too long'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).max(50).optional(),
});

export const verifySchema = z.object({
  action: z.enum(['verify', 'analyze', 'extract_skills', 'safety_check', 'analyze_github', 'custom']),
  url: z.string().url().optional(),
  text: z.string().max(10000).optional(),
  proofData: z.any().optional(),
});

export const skillsSchema = z.object({
  text: z.string().min(1).max(10000).optional(),
  targetRole: z.string().max(200).optional(),
});

export const matchSchema = z.object({
  userSkills: z.array(z.string()).max(50).optional(),
  opportunityId: z.string().uuid().optional(),
});

export const learningPathSchema = z.object({
  currentSkills: z.array(z.string()).max(50).optional(),
  targetRole: z.string().min(1).max(200),
  timeframe: z.enum(['3months', '6months', '1year']).optional(),
});

export const scoreSchema = z.object({
  portfolioData: z.any().optional(),
});

export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.flatten().fieldErrors,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}