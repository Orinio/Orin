"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyCheckSchema = exports.matchRequestSchema = exports.chatStreamSchema = exports.learningPathSchema = exports.matchOpportunitiesSchema = exports.generateCoachNoteSchema = exports.coachNoteType = exports.verifyRequestSchema = exports.verifyActionSchema = exports.chatMessageSchema = exports.getOpportunitiesSchema = exports.opportunityType = exports.updateProofSchema = exports.createProofSchema = exports.proofSourceType = exports.updateUserProfileSchema = exports.resetPasswordSchema = exports.signUpSchema = exports.signInSchema = exports.urlSchema = exports.uuidSchema = exports.usernameSchema = exports.emailSchema = void 0;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
// ============================================================
// Common schemas
// ============================================================
exports.emailSchema = zod_1.z.string().email('Invalid email format').max(255);
exports.usernameSchema = zod_1.z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores');
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.urlSchema = zod_1.z.string().url('Invalid URL format').max(2048);
// ============================================================
// Auth schemas
// ============================================================
exports.signInSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.signUpSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    fullName: zod_1.z.string().min(1, 'Name is required').max(100).optional(),
    username: exports.usernameSchema.optional(),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: exports.emailSchema,
});
// ============================================================
// User schemas
// ============================================================
exports.updateUserProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).max(100).optional(),
    username: exports.usernameSchema.optional(),
    bio: zod_1.z.string().max(500).optional(),
    headline: zod_1.z.string().max(200).optional(),
    college: zod_1.z.string().max(200).optional(),
    year: zod_1.z.enum(['first', 'second', 'third', 'fourth', 'graduate']).optional(),
    location: zod_1.z.string().max(200).optional(),
    websiteUrl: exports.urlSchema.optional().nullable(),
    githubUrl: exports.urlSchema.optional().nullable(),
    linkedinUrl: exports.urlSchema.optional().nullable(),
    twitterUrl: exports.urlSchema.optional().nullable(),
});
// ============================================================
// Proof schemas
// ============================================================
exports.proofSourceType = zod_1.z.enum([
    'github',
    'kaggle',
    'certificate',
    'hackathon',
    'project',
    'blog',
    'demo',
    'other',
]);
exports.createProofSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200),
    description: zod_1.z.string().max(2000).optional(),
    sourceType: exports.proofSourceType,
    sourceUrl: exports.urlSchema.optional().nullable(),
    skillsExtracted: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    skillsUserAdded: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    whatItProves: zod_1.z.array(zod_1.z.string().max(200)).max(10).optional(),
    visibility: zod_1.z.enum(['private', 'unlisted', 'public']).optional(),
});
exports.updateProofSchema = exports.createProofSchema.partial();
// ============================================================
// Opportunity schemas
// ============================================================
exports.opportunityType = zod_1.z.enum([
    'internship',
    'job',
    'scholarship',
    'mentorship',
    'hackathon',
    'research',
    'other',
]);
exports.getOpportunitiesSchema = zod_1.z.object({
    company: zod_1.z.string().max(200).optional(),
    type: exports.opportunityType.optional(),
    search: zod_1.z.string().max(200).optional(),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(20),
});
// ============================================================
// AI Chat schemas
// ============================================================
exports.chatMessageSchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .min(1, 'Message is required')
        .max(2000, 'Message must be at most 2000 characters'),
    history: zod_1.z
        .array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant']),
        content: zod_1.z.string().max(2000),
    }))
        .max(10)
        .optional()
        .default([]),
});
// ============================================================
// AI Verify schemas
// ============================================================
exports.verifyActionSchema = zod_1.z.enum([
    'verify',
    'analyze',
    'extract_skills',
    'check_safety',
    'analyze_github',
    'custom',
]);
exports.verifyRequestSchema = zod_1.z.object({
    action: exports.verifyActionSchema,
    proofId: exports.uuidSchema.optional(),
    proofUrl: exports.urlSchema.optional(),
    sourceType: exports.proofSourceType.optional(),
    proofData: zod_1.z
        .object({
        title: zod_1.z.string().max(200),
        description: zod_1.z.string().max(2000).optional(),
        sourceType: exports.proofSourceType,
        sourceUrl: exports.urlSchema.optional(),
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        whatItProves: zod_1.z.array(zod_1.z.string()).optional(),
        metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    })
        .optional(),
    text: zod_1.z.string().max(5000).optional(),
    username: zod_1.z.string().max(50).optional(),
    url: exports.urlSchema.optional(),
    query: zod_1.z.string().max(2000).optional(),
});
// ============================================================
// Coach Note schemas
// ============================================================
exports.coachNoteType = zod_1.z.enum(['daily', 'weekly', 'milestone', 'ad_hoc']);
exports.generateCoachNoteSchema = zod_1.z.object({
    noteType: exports.coachNoteType,
    milestone: zod_1.z.string().max(200).optional(),
    userQuery: zod_1.z.string().max(2000).optional(),
});
// ============================================================
// Match Opportunities schemas
// ============================================================
exports.matchOpportunitiesSchema = zod_1.z.object({
    userId: exports.uuidSchema,
    targetRole: zod_1.z.string().max(100).optional(),
    limit: zod_1.z.number().int().positive().max(50).optional().default(10),
    includeSkillGaps: zod_1.z.boolean().optional().default(true),
});
// ============================================================
// Learning Path schemas
// ============================================================
exports.learningPathSchema = zod_1.z.object({
    targetRole: zod_1.z.string().max(100).optional(),
    timeframe: zod_1.z.enum(['1month', '3months', '6months', '1year']).optional().default('3months'),
    focusAreas: zod_1.z.array(zod_1.z.string().max(50)).max(5).optional().default([]),
});
// ============================================================
// Chat Stream schemas
// ============================================================
exports.chatStreamSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message is required').max(2000, 'Message must be at most 2000 characters'),
    history: zod_1.z
        .array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant']),
        content: zod_1.z.string().max(2000),
    }))
        .max(10)
        .optional()
        .default([]),
});
// ============================================================
// Match schemas
// ============================================================
exports.matchRequestSchema = zod_1.z.object({
    limit: zod_1.z.number().int().positive().max(50).optional().default(10),
});
// ============================================================
// Safety Check schemas
// ============================================================
exports.safetyCheckSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format').max(2048).optional(),
    email: zod_1.z.string().email('Invalid email format').max(255).optional(),
});
// ============================================================
// Validation helper
// ============================================================
function validateRequest(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errorMessage = result.error.issues.map((e) => e.message).join(', ');
    return { success: false, error: errorMessage };
}
//# sourceMappingURL=validations.js.map