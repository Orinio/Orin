import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { getAgent } from '../lib/ai/agents/index.js';
import { runAgent, runAgentStream } from '../lib/ai/core/agent-runner.js';
import { initTools } from '../lib/ai/tools/index.js';
import { analyzeSkills, identifySkillGaps, getSkillRecommendations, extractSkillsFromProofs } from '../lib/skills.js';
import { checkAIRateLimit, logAIUsage } from '../lib/rate-limit.js';
import { validateRequest, verifyRequestSchema, chatMessageSchema } from '../lib/validations.js';
import type { AgentContext } from '../lib/ai/core/types.js';

// Initialize tools on module load
initTools();

export const aiRouter = Router();

async function buildAgentContext(userId: string): Promise<AgentContext> {
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('*')
    .eq('user_id', userProfile?.id)
    .is('deleted_at', null);

  const skillAnalysis = analyzeSkills(proofs || []);

  return {
    userId: userProfile?.id || userId,
    userProfile,
    proofs: proofs || [],
    skillAnalysis,
  };
}

// POST /ai/verify — Verify a proof
aiRouter.post('/verify', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const rateLimitResult = await checkAIRateLimit(supabase, userId, 'ai-verify');
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason, nextAllowedAt: rateLimitResult.nextAllowedAt } });
      return;
    }

    const validation = validateRequest(verifyRequestSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error } });
      return;
    }

    const { action, proofId, proofUrl, sourceType, proofData, text, username, url, query } = validation.data;
    const context = await buildAgentContext((req as any).user.id);
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
aiRouter.post('/chat', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const rateLimitResult = await checkAIRateLimit(supabase, userId, 'ai-chat');
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
      return;
    }

    const validation = validateRequest(chatMessageSchema, req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error } });
      return;
    }

    const { message, history } = validation.data;
    const context = await buildAgentContext((req as any).user.id);
    context.conversationHistory = history?.slice(-6).map((m: any) => ({ role: m.role, content: m.content }));

    const agent = getAgent('chat')!;
    const result = await runAgent(agent, message, context);

    await logAIUsage(supabase, userId, 'ai-chat', result.totalTokens);
    res.json({ success: true, response: { content: result.answer || 'I apologize, but I was unable to generate a response.', thinking: result.thinking, tokensUsed: result.totalTokens, iterations: result.iterations } });
  } catch (err) {
    logger.error({ err }, 'AI chat error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/chat-stream — Streaming chat
aiRouter.post('/chat-stream', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const rateLimitResult = await checkAIRateLimit(supabase, userId, 'ai-chat');
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
      return;
    }

    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Message is required' } });
      return;
    }

    const context = await buildAgentContext((req as any).user.id);
    context.conversationHistory = history.slice(-6).map((m: any) => ({ role: m.role, content: m.content }));

    const acceptHeader = req.headers.accept;
    const wantsStreaming = acceptHeader?.includes('text/event-stream');

    if (wantsStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const agent = getAgent('chat')!;
      await runAgentStream(agent, message, context, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else {
      const agent = getAgent('chat')!;
      const result = await runAgent(agent, message, context);
      await logAIUsage(supabase, userId, 'ai-chat', result.totalTokens);
      res.json({ success: true, response: { content: result.answer, thinking: result.thinking, tokensUsed: result.totalTokens } });
    }
  } catch (err) {
    logger.error({ err }, 'AI chat-stream error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// GET /ai/skills — Skill analysis
aiRouter.get('/skills', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const rateLimitResult = await checkAIRateLimit(supabase, userId, 'ai-skills');
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
      return;
    }

    const context = await buildAgentContext((req as any).user.id);
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
aiRouter.post('/match', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const rateLimitResult = await checkAIRateLimit(supabase, userId, 'ai-match-opportunities');
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
      return;
    }

    const context = await buildAgentContext((req as any).user.id);
    const { limit = 10 } = req.body;

    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null);

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

    await logAIUsage(supabase, userId, 'ai-match-opportunities', 0);
    res.json({ success: true, matches, skillAnalysis: { topSkills: context.skillAnalysis?.topSkills.slice(0, 10), uniqueSkills: context.skillAnalysis?.uniqueSkills } });
  } catch (err) {
    logger.error({ err }, 'Match opportunities error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// POST /ai/learning-path — Generate learning path
aiRouter.post('/learning-path', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const rateLimitResult = await checkAIRateLimit(supabase, userId, 'ai-match-opportunities');
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason } });
      return;
    }

    const context = await buildAgentContext((req as any).user.id);
    const { targetRole, timeframe = '3months' } = req.body;

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
aiRouter.post('/score', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) { res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } }); return; }

    const context = await buildAgentContext((req as any).user.id);
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
aiRouter.post('/safety', async (req, res) => {
  try {
    const { url, email } = req.body;
    const context = await buildAgentContext((req as any).user?.id || '');
    const agent = getAgent('safety-guard')!;
    const query = url ? `Check safety of URL: ${url}` : email ? `Validate email: ${email}` : 'No input provided';
    const result = await runAgent(agent, query, context);
    res.json({ success: true, result: { thinking: result.thinking, answer: result.answer, safe: result.answer.toLowerCase().includes('safe'), toolCalls: result.toolCalls.map(tc => ({ tool: tc.tool, success: tc.result.success, data: tc.result.data })) } });
  } catch (err) {
    logger.error({ err }, 'Safety check error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});
