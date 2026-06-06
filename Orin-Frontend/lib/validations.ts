import { z } from 'zod';

// ============================================================
// Common schemas
// ============================================================

export const emailSchema = z.string().email('Invalid email format').max(255);
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const urlSchema = z.string().url('Invalid URL format').max(2048);

// ============================================================
// Auth schemas
// ============================================================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Name is required').max(100).optional(),
  username: usernameSchema.optional(),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// ============================================================
// User schemas
// ============================================================

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(500).optional(),
  headline: z.string().max(200).optional(),
  college: z.string().max(200).optional(),
  year: z.enum(['first', 'second', 'third', 'fourth', 'graduate']).optional(),
  location: z.string().max(200).optional(),
  websiteUrl: urlSchema.optional().nullable(),
  githubUrl: urlSchema.optional().nullable(),
  linkedinUrl: urlSchema.optional().nullable(),
  twitterUrl: urlSchema.optional().nullable(),
});

// ============================================================
// Proof schemas
// ============================================================

export const proofSourceType = z.enum([
  'github',
  'kaggle',
  'certificate',
  'hackathon',
  'project',
  'blog',
  'demo',
  'other',
]);

export const createProofSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  sourceType: proofSourceType,
  sourceUrl: urlSchema.optional().nullable(),
  skillsExtracted: z.array(z.string().max(50)).max(20).optional(),
  skillsUserAdded: z.array(z.string().max(50)).max(20).optional(),
  whatItProves: z.array(z.string().max(200)).max(10).optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).optional(),
});

export const updateProofSchema = createProofSchema.partial();

// ============================================================
// Opportunity schemas
// ============================================================

export const opportunityType = z.enum([
  'internship',
  'job',
  'scholarship',
  'mentorship',
  'hackathon',
  'research',
  'other',
]);

export const getOpportunitiesSchema = z.object({
  company: z.string().max(200).optional(),
  type: opportunityType.optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ============================================================
// AI Chat schemas
// ============================================================

export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be at most 2000 characters'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .max(10)
    .optional()
    .default([]),
});

// ============================================================
// AI Verify schemas
// ============================================================

export const verifyActionSchema = z.enum([
  'verify',
  'analyze',
  'extract_skills',
  'check_safety',
  'analyze_github',
  'custom',
]);

export const verifyRequestSchema = z.object({
  action: verifyActionSchema,
  proofId: uuidSchema.optional(),
  proofUrl: urlSchema.optional(),
  sourceType: proofSourceType.optional(),
  proofData: z
    .object({
      title: z.string().max(200),
      description: z.string().max(2000).optional(),
      sourceType: proofSourceType,
      sourceUrl: urlSchema.optional(),
      skills: z.array(z.string()).optional(),
      whatItProves: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  text: z.string().max(5000).optional(),
  username: z.string().max(50).optional(),
  url: urlSchema.optional(),
  query: z.string().max(2000).optional(),
});

// ============================================================
// Coach Note schemas
// ============================================================

export const coachNoteType = z.enum(['daily', 'weekly', 'milestone', 'ad_hoc']);

export const generateCoachNoteSchema = z.object({
  noteType: coachNoteType,
  milestone: z.string().max(200).optional(),
  userQuery: z.string().max(2000).optional(),
});

// ============================================================
// Match Opportunities schemas
// ============================================================

export const matchOpportunitiesSchema = z.object({
  userId: uuidSchema,
  targetRole: z.string().max(100).optional(),
  limit: z.number().int().positive().max(50).optional().default(10),
  includeSkillGaps: z.boolean().optional().default(true),
});

// ============================================================
// Learning Path schemas
// ============================================================

export const learningPathSchema = z.object({
  targetRole: z.string().max(100).optional(),
  timeframe: z.enum(['1month', '3months', '6months', '1year']).optional().default('3months'),
  focusAreas: z.array(z.string().max(50)).max(5).optional().default([]),
});

// ============================================================
// Validation helper
// ============================================================

export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.issues.map((e) => e.message).join(', ');
  return { success: false, error: errorMessage };
}
