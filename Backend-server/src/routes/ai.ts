import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { getAgent } from '../lib/ai/agents/index.js';
import { runAgent } from '../lib/ai/core/agent-runner.js';
import type { AgentMessage } from '../lib/ai/orchestrator/agent-orchestrator.js';
import { analyzeSkills, identifySkillGaps, getSkillRecommendations, extractSkillsFromProofs } from '../lib/skills.js';
import { logAIUsage } from '../lib/rate-limit.js';
import { chatMessageSchema, verifyRequestSchema } from '../lib/validations.js';
import { buildAgentContext } from '../lib/context.js';
import { isNvidiaConfigured } from '../lib/ai/core/nvidia.js';
import { userRateLimitMiddleware, getCached, setCache } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';

export const aiRouter = Router();

// Simple in-memory cache for opportunities (shared across users, rarely changes)
const opportunityCache = { data: null as any[] | null, expiresAt: 0 };
const OPPORTUNITY_CACHE_TTL_MS = 300_000; // 5 minutes

async function getCachedOpportunities(): Promise<any[]> {
  const now = Date.now();
  if (opportunityCache.data && opportunityCache.expiresAt > now) {
    return opportunityCache.data;
  }

  const { data } = await supabase
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
function getFallbackResponse(operation: string, context: any): { answer: string; degraded: boolean } {
  const skills = extractSkillsFromProofs(context.proofs);
  const verifiedCount = context.proofs.filter((p: any) => p.verification_status === 'verified').length;

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
aiRouter.post('/verify', userRateLimitMiddleware('ai-verify'), validate(verifyRequestSchema), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const userId = (req as any).internalUserId || authUserId;

    const { action, proofId, proofUrl, sourceType, proofData, text, username, url, query } = req.body;
    const context = await buildAgentContext(authUserId);
    const agent = getAgent('verification')!;

    let result;
    switch (action) {
      case 'verify': {
        if (!proofUrl || !sourceType) {
          res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'proofUrl and sourceType required' } });
          return;
        }

        const { data: proof } = await supabase
          .from('proof_cards')
          .select('*')
          .eq('id', proofId)
          .eq('user_id', context.userId)
          .single();

        if (!proof) {
          res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proof not found' } });
          return;
        }

        result = await runAgent(agent, `Verify this ${sourceType} proof: ${proofUrl}`, context);
        const verified = result.toolCalls.some(tc => tc.result.success && tc.result.data?.exists === true);

        await supabase
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

        await logAIUsage(supabase, userId, 'ai-verify', result.totalTokens);
        res.json({ success: true, action: 'verify', result: { verified, thinking: result.thinking, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, args: tc.args, success: tc.result.success, data: tc.result.data })), answer: result.answer, iterations: result.iterations, tokensUsed: result.totalTokens, model: result.model, durationMs: result.durationMs } });
        break;
      }
      case 'analyze': {
        if (!proofData) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'proofData required' } }); return; }
        result = await runAgent(getAgent('portfolio-scorer')!, `Analyze this proof: ${JSON.stringify(proofData)}`, context);
        await logAIUsage(supabase, userId, 'ai-verify', result.totalTokens);
        res.json({ success: true, action: 'analyze', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success })), iterations: result.iterations, tokensUsed: result.totalTokens } });
        break;
      }
      case 'extract_skills': {
        if (!text) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'text required' } }); return; }
        result = await runAgent(getAgent('skill-analysis')!, `Extract skills from: ${text}`, context);
        res.json({ success: true, action: 'extract_skills', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })), iterations: result.iterations, tokensUsed: result.totalTokens } });
        break;
      }
      case 'check_safety': {
        if (!url) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'url required' } }); return; }
        result = await runAgent(getAgent('safety-guard')!, `Check safety of: ${url}`, context);
        res.json({ success: true, action: 'check_safety', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })), iterations: result.iterations, tokensUsed: result.totalTokens } });
        break;
      }
      case 'analyze_github': {
        if (!username) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'username required' } }); return; }
        result = await runAgent(agent, `Analyze GitHub profile: ${username}`, context);
        res.json({ success: true, action: 'analyze_github', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })), iterations: result.iterations, tokensUsed: result.totalTokens } });
        break;
      }
      case 'custom': {
        if (!query) { res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'query required' } }); return; }
        result = await runAgent(getAgent('chat')!, query, context);
        res.json({ success: true, action: 'custom', result: { thinking: result.thinking, answer: result.answer, toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success })), iterations: result.iterations, tokensUsed: result.totalTokens } });
        break;
      }
      default:
        res.status(400).json({ error: { code: 'INVALID_ACTION', message: 'Invalid action' } });
    }
  } catch (err) {
    logger.error({ err }, 'AI verify error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/chat — Non-streaming chat
aiRouter.post('/chat', userRateLimitMiddleware('ai-chat'), validate(chatMessageSchema), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const userId = (req as any).internalUserId || authUserId;
    const { message, history } = req.body;
    const context = await buildAgentContext(authUserId);
    context.conversationHistory = (history || []).slice(-6).map((m: any) => ({ role: m.role, content: m.content }));

    // Graceful degradation: return fallback if AI is unavailable
    if (!isNvidiaConfigured()) {
      const fallback = getFallbackResponse('chat', context);
      res.json({ success: true, response: { content: fallback.answer, thinking: '', degraded: fallback.degraded } });
      return;
    }

    const agent = getAgent('chat')!;
    const result = await runAgent(agent, message, context);

    await logAIUsage(supabase, userId, 'ai-chat', result.totalTokens);
    res.json({ success: true, response: { content: result.answer || 'I apologize, but I was unable to generate a response.', thinking: result.thinking, tokensUsed: result.totalTokens, iterations: result.iterations } });
  } catch (err) {
    logger.error({ err }, 'AI chat error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/chat-stream — Streaming chat with full agentic behavior
aiRouter.post('/chat-stream', userRateLimitMiddleware('ai-chat-stream'), async (req, res) => {
  let headersSent = false;
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const userId = (req as any).internalUserId || authUserId;

    // Support both formats: { message, history } (workspace) and { messages } (legacy)
    const bodyMessage = req.body.message;
    const bodyMessages = req.body.messages;
    const message = bodyMessage || (bodyMessages?.length
      ? [...bodyMessages].reverse().find((m: any) => m.role === 'user')?.content || ''
      : '');
    const history = req.body.history || (bodyMessages?.length
      ? bodyMessages.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content }))
      : []);
    const model = req.body.model;
    if (!message) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Message is required' } }); return; }

    const context = await buildAgentContext(authUserId);
    context.conversationHistory = (history || []).slice(-6).map((m: any) => ({ role: m.role, content: m.content }));

    const acceptHeader = req.headers.accept;
    const wantsStreaming = acceptHeader?.includes('text/event-stream');

    if (wantsStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      headersSent = true;

      const sendEvent = (event: string, data: any) => {
        try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch {}
      };

      // Use orchestrator with memory, tool calling, and full user context
      const { createOrchestrator } = await import('../lib/ai/orchestrator/agent-orchestrator.js');
      const orchestrator = createOrchestrator(userId);

      sendEvent('start', { agentId: 'chat', query: message });

      await orchestrator.runAgentStream(
        'chat',
        message,
        { userId, authUserId, conversationHistory: context.conversationHistory as AgentMessage[], modelOverride: model || undefined },
        (event, data) => sendEvent(event, data)
      );

      res.write('event: end\ndata: {}\n\n');
      res.end();
    } else {
      // Non-streaming: use orchestrator with full tool calling
      const { createOrchestrator } = await import('../lib/ai/orchestrator/agent-orchestrator.js');
      const orchestrator = createOrchestrator(userId);
      const result = await orchestrator.runAgent('chat', message, {
        userId,
        authUserId,
        conversationHistory: context.conversationHistory as AgentMessage[]
      });

      await logAIUsage(supabase, userId, 'ai-chat', result.tokensUsed);
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
  } catch (err) {
    logger.error({ err }, 'AI chat-stream error');
    if (headersSent) {
      try { res.write(`event: error\ndata: ${JSON.stringify({ message: 'Internal server error' })}\n\n`); } catch {}
      try { res.end(); } catch {}
    } else {
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
  }
});

// GET /ai/skills — Skill analysis
aiRouter.get('/skills', userRateLimitMiddleware('ai-skills'), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const context = await buildAgentContext(authUserId);
    const { searchParams } = new URL(req.url, `http://localhost`);
    const targetRole = searchParams.get('targetRole') || undefined;

    const skillAnalysis = analyzeSkills(context.proofs, targetRole);
    const userSkills = extractSkillsFromProofs(context.proofs);
    const skillGaps = identifySkillGaps(userSkills, targetRole);
    const recommendations = getSkillRecommendations(skillAnalysis);

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
        verifiedCount: context.proofs.filter((p: any) => p.verification_status === 'verified').length,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Skills analysis error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/match — Match opportunities
aiRouter.post('/match', userRateLimitMiddleware('ai-match'), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    // Check response cache (deterministic: same skills + same opportunities = same result)
    const cacheKey = `match:${authUserId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const context = await buildAgentContext(authUserId);
    const { limit = 10 } = req.body || {};

    const opportunities = await getCachedOpportunities();

    const userSkillsSet = new Set(extractSkillsFromProofs(context.proofs).map(s => s.toLowerCase()));

    const matches = (opportunities || []).map(opp => {
      const required = (opp.required_skills || []).map((s: string) => s.toLowerCase());
      const nice = (opp.nice_to_have || []).map((s: string) => s.toLowerCase());
      const matchedRequired = required.filter((s: string) => userSkillsSet.has(s));
      const matchedNice = nice.filter((s: string) => userSkillsSet.has(s));
      const missingRequired = required.filter((s: string) => !userSkillsSet.has(s));

      const score = Math.round(
        ((matchedRequired.length * 1.0 + matchedNice.length * 0.3) /
          (required.length * 1.0 + nice.length * 0.3)) * 100
      );

      return {
        opportunityId: opp.id, title: opp.title, company: opp.company, type: opp.type,
        matchScore: Math.min(100, Math.max(0, score || 0)),
        matchedSkills: [...matchedRequired, ...matchedNice],
        missingSkills: missingRequired,
        reasoning: `Matches ${matchedRequired.length}/${required.length} required skills`,
      };
    }).sort((a: any, b: any) => b.matchScore - a.matchScore).slice(0, limit);

    const response = { success: true, matches, skillAnalysis: { topSkills: context.skillAnalysis?.topSkills.slice(0, 10), uniqueSkills: context.skillAnalysis?.uniqueSkills } };
    setCache(cacheKey, response, 120_000); // Cache for 2 minutes

    await logAIUsage(supabase, (req as any).internalUserId || authUserId, 'ai-match-opportunities', 0);
    res.json(response);
  } catch (err) {
    logger.error({ err }, 'Match opportunities error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/learning-path — Generate learning path
aiRouter.post('/learning-path', userRateLimitMiddleware('ai-learning-path'), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const userId = (req as any).internalUserId || authUserId;
    const context = await buildAgentContext(authUserId);
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

    const userSkills = extractSkillsFromProofs(context.proofs);
    const skillGaps = identifySkillGaps(userSkills, targetRole);
    const agent = getAgent('learning-path')!;

    const query = `Create a ${timeframe} learning path for a ${targetRole || 'developer'} with skills: ${userSkills.slice(0, 10).join(', ')}. Gaps: ${skillGaps.slice(0, 5).map(g => g.skill).join(', ')}`;
    const result = await runAgent(agent, query, context);

    await logAIUsage(supabase, userId, 'ai-match-opportunities', result.totalTokens);
    res.json({ success: true, learningPath: result.answer, thinking: result.thinking, tokensUsed: result.totalTokens });
  } catch (err) {
    logger.error({ err }, 'Learning path error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/score — Score portfolio
aiRouter.post('/score', userRateLimitMiddleware('ai-score'), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const userId = (req as any).internalUserId || authUserId;
    const context = await buildAgentContext(authUserId);
    const agent = getAgent('portfolio-scorer')!;
    const result = await runAgent(agent, `Score this portfolio: ${context.proofs.length} proofs, ${context.proofs.filter((p: any) => p.verification_status === 'verified').length} verified, skills: ${extractSkillsFromProofs(context.proofs).slice(0, 10).join(', ')}`, context);

    await logAIUsage(supabase, userId, 'ai-skills', result.totalTokens);
    res.json({ success: true, score: result.answer, thinking: result.thinking, tokensUsed: result.totalTokens });
  } catch (err) {
    logger.error({ err }, 'Portfolio score error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/safety — Check safety
aiRouter.post('/safety', userRateLimitMiddleware('ai-safety'), async (req, res) => {
  try {
    const authUserId = (req as any).user?.id;
    if (!authUserId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const { url, email } = req.body;
    if (!url && !email) {
      res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Either url or email is required' } });
      return;
    }

    const context = await buildAgentContext(authUserId);
    const agent = getAgent('safety-guard')!;
    const query = url ? `Check safety of URL: ${url}` : `Validate email: ${email}`;
    const result = await runAgent(agent, query, context);
    res.json({ success: true, result: { thinking: result.thinking, answer: result.answer, safe: result.answer.toLowerCase().includes('safe'), toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })) } });
  } catch (err) {
    logger.error({ err }, 'Safety check error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});
