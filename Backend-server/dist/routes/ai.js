"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
const index_js_1 = require("../lib/ai/agents/index.js");
const agent_runner_js_1 = require("../lib/ai/core/agent-runner.js");
const skills_js_1 = require("../lib/skills.js");
const rate_limit_js_1 = require("../lib/rate-limit.js");
const validations_js_1 = require("../lib/validations.js");
const context_js_1 = require("../lib/context.js");
const nvidia_js_1 = require("../lib/ai/core/nvidia.js");
exports.aiRouter = (0, express_1.Router)();
// Simple in-memory cache for opportunities (shared across users, rarely changes)
const opportunityCache = { data: null, expiresAt: 0 };
const OPPORTUNITY_CACHE_TTL_MS = 300_000; // 5 minutes
async function getCachedOpportunities() {
    const now = Date.now();
    if (opportunityCache.data && opportunityCache.expiresAt > now) {
        return opportunityCache.data;
    }
    const { data } = await supabase_js_1.supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null);
    opportunityCache.data = data || [];
    opportunityCache.expiresAt = now + OPPORTUNITY_CACHE_TTL_MS;
    return opportunityCache.data;
}
/**
 * Graceful degradation: return a helpful fallback when AI is unavailable.
 * Uses deterministic logic based on user's existing data.
 */
function getFallbackResponse(operation, context) {
    const skills = (0, skills_js_1.extractSkillsFromProofs)(context.proofs);
    const verifiedCount = context.proofs.filter((p) => p.verification_status === 'verified').length;
    switch (operation) {
        case 'chat':
            return {
                answer: `I'm currently experiencing high demand. Here's a quick summary of your profile:\n\n` +
                    `• ${context.proofs.length} proofs (${verifiedCount} verified)\n` +
                    `• Top skills: ${skills.slice(0, 5).join(', ') || 'None yet'}\n\n` +
                    `Please try again in a few minutes for AI-powered advice.`,
                degraded: true,
            };
        case 'skills':
            return {
                answer: `Skill analysis is temporarily unavailable. Based on your ${context.proofs.length} proofs, ` +
                    `your top skills are: ${skills.slice(0, 10).join(', ') || 'None detected'}.`,
                degraded: true,
            };
        case 'match':
            return {
                answer: `Opportunity matching is temporarily unavailable. You have ${context.proofs.length} proofs ` +
                    `covering ${skills.length} unique skills. Try again shortly for personalized matches.`,
                degraded: true,
            };
        default:
            return {
                answer: 'AI service is temporarily unavailable. Please try again in a few minutes.',
                degraded: true,
            };
    }
}
// POST /ai/verify — Verify a proof
exports.aiRouter.post('/verify', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const rateLimitResult = await (0, rate_limit_js_1.checkAIRateLimit)(supabase_js_1.supabase, userId, 'ai-verify');
        if (!rateLimitResult.allowed) {
            res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason, nextAllowedAt: rateLimitResult.nextAllowedAt } });
            return;
        }
        const validation = (0, validations_js_1.validateRequest)(validations_js_1.verifyRequestSchema, req.body);
        if (!validation.success) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error } });
            return;
        }
        const { action, proofId, proofUrl, sourceType, proofData, text, username, url, query } = validation.data;
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        const agent = (0, index_js_1.getAgent)('verification');
        let result;
        switch (action) {
            case 'verify': {
                if (!proofUrl || !sourceType) {
                    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'proofUrl and sourceType required' } });
                    return;
                }
                const { data: proof } = await supabase_js_1.supabase
                    .from('proof_cards')
                    .select('*')
                    .eq('id', proofId)
                    .eq('user_id', context.userId)
                    .single();
                if (!proof) {
                    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proof not found' } });
                    return;
                }
                result = await (0, agent_runner_js_1.runAgent)(agent, `Verify this ${sourceType} proof: ${proofUrl}`, context);
                const verified = result.toolCalls.some(tc => tc.result.success && tc.result.data?.exists === true);
                await supabase_js_1.supabase
                    .from('proof_cards')
                    .update({
                    verification_status: verified ? 'verified' : 'rejected',
                    verified_at: verified ? new Date().toISOString() : null,
                    metadata: {
                        ...proof.metadata,
                        verification: { verified, timestamp: new Date().toISOString(), agentId: 'verification', toolCalls: result.toolCalls.length },
                    },
                })
                    .eq('id', proofId);
                await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-verify', result.totalTokens);
                res.json({ success: true, action: 'verify', result: { verified, thinking: result.thinking, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, args: tc.args, success: tc.result.success, data: tc.result.data })), answer: result.answer, iterations: result.iterations, tokensUsed: result.totalTokens, model: result.model, durationMs: result.durationMs } });
                break;
            }
            case 'analyze': {
                if (!proofData) {
                    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'proofData required' } });
                    return;
                }
                result = await (0, agent_runner_js_1.runAgent)((0, index_js_1.getAgent)('portfolio-scorer'), `Analyze this proof: ${JSON.stringify(proofData)}`, context);
                await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-verify', result.totalTokens);
                res.json({ success: true, action: 'analyze', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success })), iterations: result.iterations, tokensUsed: result.totalTokens } });
                break;
            }
            case 'extract_skills': {
                if (!text) {
                    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'text required' } });
                    return;
                }
                result = await (0, agent_runner_js_1.runAgent)((0, index_js_1.getAgent)('skill-analysis'), `Extract skills from: ${text}`, context);
                res.json({ success: true, action: 'extract_skills', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })), iterations: result.iterations, tokensUsed: result.totalTokens } });
                break;
            }
            case 'check_safety': {
                if (!url) {
                    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'url required' } });
                    return;
                }
                result = await (0, agent_runner_js_1.runAgent)((0, index_js_1.getAgent)('safety-guard'), `Check safety of: ${url}`, context);
                res.json({ success: true, action: 'check_safety', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })), iterations: result.iterations, tokensUsed: result.totalTokens } });
                break;
            }
            case 'analyze_github': {
                if (!username) {
                    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'username required' } });
                    return;
                }
                result = await (0, agent_runner_js_1.runAgent)(agent, `Analyze GitHub profile: ${username}`, context);
                res.json({ success: true, action: 'analyze_github', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })), iterations: result.iterations, tokensUsed: result.totalTokens } });
                break;
            }
            case 'custom': {
                if (!query) {
                    res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'query required' } });
                    return;
                }
                result = await (0, agent_runner_js_1.runAgent)((0, index_js_1.getAgent)('chat'), query, context);
                res.json({ success: true, action: 'custom', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success })), iterations: result.iterations, tokensUsed: result.totalTokens } });
                break;
            }
            default:
                res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Invalid action' } });
        }
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'AI verify error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// POST /ai/chat — Non-streaming chat
exports.aiRouter.post('/chat', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const rateLimitResult = await (0, rate_limit_js_1.checkAIRateLimit)(supabase_js_1.supabase, userId, 'ai-chat');
        if (!rateLimitResult.allowed) {
            res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
            return;
        }
        const validation = (0, validations_js_1.validateRequest)(validations_js_1.chatMessageSchema, req.body);
        if (!validation.success) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error } });
            return;
        }
        const { message, history } = validation.data;
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        context.conversationHistory = history?.slice(-6).map((m) => ({ role: m.role, content: m.content }));
        // Graceful degradation: return fallback if AI is unavailable
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            const fallback = getFallbackResponse('chat', context);
            res.json({ success: true, response: { content: fallback.answer, thinking: '', degraded: fallback.degraded } });
            return;
        }
        const agent = (0, index_js_1.getAgent)('chat');
        const result = await (0, agent_runner_js_1.runAgent)(agent, message, context);
        await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-chat', result.totalTokens);
        res.json({ success: true, response: { content: result.answer || 'I apologize, but I was unable to generate a response.', thinking: result.thinking, tokensUsed: result.totalTokens, iterations: result.iterations } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'AI chat error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// POST /ai/chat-stream — Streaming chat with full agentic behavior
exports.aiRouter.post('/chat-stream', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const rateLimitResult = await (0, rate_limit_js_1.checkAIRateLimit)(supabase_js_1.supabase, userId, 'ai-chat');
        if (!rateLimitResult.allowed) {
            res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
            return;
        }
        const streamValidation = (0, validations_js_1.validateRequest)(validations_js_1.chatStreamSchema, req.body);
        if (!streamValidation.success) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: streamValidation.error } });
            return;
        }
        const { message, history } = streamValidation.data;
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        context.conversationHistory = history.slice(-6).map((m) => ({ role: m.role, content: m.content }));
        const acceptHeader = req.headers.accept;
        const wantsStreaming = acceptHeader?.includes('text/event-stream');
        if (wantsStreaming) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');
            const sendEvent = (event, data) => {
                res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            };
            // Use orchestrator with memory, tool calling, and full user context
            const { createOrchestrator } = await import('../lib/ai/orchestrator/agent-orchestrator.js');
            const orchestrator = createOrchestrator(userId);
            sendEvent('start', { agentId: 'chat', query: message });
            await orchestrator.runAgentStream('chat', message, { userId, conversationHistory: context.conversationHistory }, (event, data) => sendEvent(event, data));
            res.write('event: end\ndata: {}\n\n');
            res.end();
        }
        else {
            // Non-streaming: use orchestrator with full tool calling
            const { createOrchestrator } = await import('../lib/ai/orchestrator/agent-orchestrator.js');
            const orchestrator = createOrchestrator(userId);
            const result = await orchestrator.runAgent('chat', message, {
                userId,
                conversationHistory: context.conversationHistory
            });
            await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-chat', result.tokensUsed);
            res.json({
                success: true,
                response: {
                    content: result.answer || 'I apologize, but I was unable to generate a response.',
                    thinking: result.thinking,
                    tokensUsed: result.tokensUsed,
                    iterations: result.iterations,
                    toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success }))
                }
            });
        }
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'AI chat-stream error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// GET /ai/skills — Skill analysis
exports.aiRouter.get('/skills', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const rateLimitResult = await (0, rate_limit_js_1.checkAIRateLimit)(supabase_js_1.supabase, userId, 'ai-skills');
        if (!rateLimitResult.allowed) {
            res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
            return;
        }
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        const { searchParams } = new URL(req.url, `http://localhost`);
        const targetRole = searchParams.get('targetRole') || undefined;
        const skillAnalysis = (0, skills_js_1.analyzeSkills)(context.proofs, targetRole);
        const userSkills = (0, skills_js_1.extractSkillsFromProofs)(context.proofs);
        const skillGaps = (0, skills_js_1.identifySkillGaps)(userSkills, targetRole);
        const recommendations = (0, skills_js_1.getSkillRecommendations)(skillAnalysis);
        res.json({
            success: true,
            analysis: {
                topSkills: skillAnalysis.topSkills.slice(0, 15),
                totalSkills: skillAnalysis.totalSkills,
                uniqueSkills: skillAnalysis.uniqueSkills,
                skills: skillAnalysis.skills.slice(0, 20),
                skillGaps: skillGaps.slice(0, 15),
                recommendations: recommendations.slice(0, 10),
                proofCount: context.proofs.length,
                verifiedCount: context.proofs.filter((p) => p.verification_status === 'verified').length,
            },
        });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Skills analysis error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// POST /ai/match — Match opportunities
exports.aiRouter.post('/match', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const rateLimitResult = await (0, rate_limit_js_1.checkAIRateLimit)(supabase_js_1.supabase, userId, 'ai-match-opportunities');
        if (!rateLimitResult.allowed) {
            res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
            return;
        }
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        const matchValidation = (0, validations_js_1.validateRequest)(validations_js_1.matchRequestSchema, req.body);
        const { limit } = matchValidation.success ? matchValidation.data : { limit: 10 };
        const opportunities = await getCachedOpportunities();
        const userSkillsSet = new Set((0, skills_js_1.extractSkillsFromProofs)(context.proofs).map(s => s.toLowerCase()));
        const matches = (opportunities || []).map(opp => {
            const required = (opp.required_skills || []).map((s) => s.toLowerCase());
            const nice = (opp.nice_to_have || []).map((s) => s.toLowerCase());
            const matchedRequired = required.filter((s) => userSkillsSet.has(s));
            const matchedNice = nice.filter((s) => userSkillsSet.has(s));
            const missingRequired = required.filter((s) => !userSkillsSet.has(s));
            const score = Math.round(((matchedRequired.length * 1.0 + matchedNice.length * 0.3) /
                (required.length * 1.0 + nice.length * 0.3)) * 100);
            return {
                opportunityId: opp.id, title: opp.title, company: opp.company, type: opp.type,
                matchScore: Math.min(100, Math.max(0, score || 0)),
                matchedSkills: [...matchedRequired, ...matchedNice],
                missingSkills: missingRequired,
                reasoning: `Matches ${matchedRequired.length}/${required.length} required skills`,
            };
        }).sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
        await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-match-opportunities', 0);
        res.json({ success: true, matches, skillAnalysis: { topSkills: context.skillAnalysis?.topSkills.slice(0, 10), uniqueSkills: context.skillAnalysis?.uniqueSkills } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Match opportunities error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// POST /ai/learning-path — Generate learning path
exports.aiRouter.post('/learning-path', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const rateLimitResult = await (0, rate_limit_js_1.checkAIRateLimit)(supabase_js_1.supabase, userId, 'ai-match-opportunities');
        if (!rateLimitResult.allowed) {
            res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
            return;
        }
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        const { targetRole, timeframe = '3months' } = req.body;
        if (!targetRole || typeof targetRole !== 'string') {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'targetRole is required' } });
            return;
        }
        const validTimeframes = ['1month', '3months', '6months', '1year'];
        if (!validTimeframes.includes(timeframe)) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `timeframe must be one of: ${validTimeframes.join(', ')}` } });
            return;
        }
        const userSkills = (0, skills_js_1.extractSkillsFromProofs)(context.proofs);
        const skillGaps = (0, skills_js_1.identifySkillGaps)(userSkills, targetRole);
        const agent = (0, index_js_1.getAgent)('learning-path');
        const query = `Create a ${timeframe} learning path for a ${targetRole || 'developer'} with skills: ${userSkills.slice(0, 10).join(', ')}. Gaps: ${skillGaps.slice(0, 5).map(g => g.skill).join(', ')}`;
        const result = await (0, agent_runner_js_1.runAgent)(agent, query, context);
        await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-match-opportunities', result.totalTokens);
        res.json({ success: true, learningPath: result.answer, thinking: result.thinking, tokensUsed: result.totalTokens });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Learning path error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// POST /ai/score — Score portfolio
exports.aiRouter.post('/score', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const context = await (0, context_js_1.buildAgentContext)(req.user.id);
        const agent = (0, index_js_1.getAgent)('portfolio-scorer');
        const result = await (0, agent_runner_js_1.runAgent)(agent, `Score this portfolio: ${context.proofs.length} proofs, ${context.proofs.filter((p) => p.verification_status === 'verified').length} verified, skills: ${(0, skills_js_1.extractSkillsFromProofs)(context.proofs).slice(0, 10).join(', ')}`, context);
        await (0, rate_limit_js_1.logAIUsage)(supabase_js_1.supabase, userId, 'ai-skills', result.totalTokens);
        res.json({ success: true, score: result.answer, thinking: result.thinking, tokensUsed: result.totalTokens });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Portfolio score error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
// POST /ai/safety — Check safety
exports.aiRouter.post('/safety', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const safetyValidation = (0, validations_js_1.validateRequest)(validations_js_1.safetyCheckSchema, req.body);
        if (!safetyValidation.success) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: safetyValidation.error } });
            return;
        }
        const { url, email } = safetyValidation.data;
        if (!url && !email) {
            res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Either url or email is required' } });
            return;
        }
        const context = await (0, context_js_1.buildAgentContext)(userId);
        const agent = (0, index_js_1.getAgent)('safety-guard');
        const query = url ? `Check safety of URL: ${url}` : `Validate email: ${email}`;
        const result = await (0, agent_runner_js_1.runAgent)(agent, query, context);
        res.json({ success: true, result: { thinking: result.thinking, answer: result.answer, safe: result.answer.toLowerCase().includes('safe'), toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })) } });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Safety check error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
//# sourceMappingURL=ai.js.map