"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreSchema = exports.learningPathSchema = exports.matchSchema = exports.skillsSchema = exports.verifySchema = exports.streamChatSchema = exports.chatQuerySchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
exports.chatQuerySchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Query is required').max(4000, 'Query too long'),
    conversationHistory: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant', 'system']),
        content: zod_1.z.string(),
    })).max(50).optional(),
    agentId: zod_1.z.string().optional(),
});
exports.streamChatSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Query is required').max(4000, 'Query too long'),
    conversationHistory: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant', 'system']),
        content: zod_1.z.string(),
    })).max(50).optional(),
});
exports.verifySchema = zod_1.z.object({
    action: zod_1.z.enum(['verify', 'analyze', 'extract_skills', 'safety_check', 'analyze_github', 'custom']),
    url: zod_1.z.string().url().optional(),
    text: zod_1.z.string().max(10000).optional(),
    proofData: zod_1.z.any().optional(),
});
exports.skillsSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(10000).optional(),
    targetRole: zod_1.z.string().max(200).optional(),
});
exports.matchSchema = zod_1.z.object({
    userSkills: zod_1.z.array(zod_1.z.string()).max(50).optional(),
    opportunityId: zod_1.z.string().uuid().optional(),
});
exports.learningPathSchema = zod_1.z.object({
    currentSkills: zod_1.z.array(zod_1.z.string()).max(50).optional(),
    targetRole: zod_1.z.string().min(1).max(200),
    timeframe: zod_1.z.enum(['3months', '6months', '1year']).optional(),
});
exports.scoreSchema = zod_1.z.object({
    portfolioData: zod_1.z.any().optional(),
});
function validate(schema) {
    return (req, res, next) => {
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
//# sourceMappingURL=validate.js.map