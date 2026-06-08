import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { getAgent } from '../lib/ai/agents/index.js';
import { runAgent } from '../lib/ai/core/agent-runner.js';
import { getPromptForNoteType, parseCoachResponse } from '../lib/prompts.js';
import { checkRateLimit } from '../lib/rate-limit.js';
import { buildAgentContext } from '../lib/context.js';
import { userRateLimitMiddleware } from '../middleware/rate-limit.js';

export const coachRouter = Router();

const generateNoteSchema = z.object({
  noteType: z.enum(['daily', 'weekly', 'milestone', 'ad_hoc']),
  milestone: z.string().optional(),
  userQuery: z.string().optional(),
});

// POST /coach/generate — Generate a coach note
coachRouter.post('/generate', userRateLimitMiddleware('coach-generate'), async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const validation = generateNoteSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
      return;
    }

    const { noteType, milestone, userQuery } = validation.data;

    const rateLimitResult = await checkRateLimit(supabase, userId, noteType);
    if (!rateLimitResult.allowed) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: rateLimitResult.reason, nextAllowedAt: rateLimitResult.nextAllowedAt } });
      return;
    }

    const context = await buildAgentContext((req as any).user.id);
    const agent = getAgent('coach')!;

    // Build the prompt using the prompts library
    const userPrompt = getPromptForNoteType({
      user: context.userProfile,
      proofs: context.proofs,
      skillAnalysis: context.skillAnalysis!,
      noteType,
      milestone,
    }, userQuery);

    // Use the agent to generate the note
    const result = await runAgent(agent, userPrompt, context);

    let coachNote = parseCoachResponse(result.answer);
    if (!coachNote) {
      // Fallback: try to parse the raw answer as JSON
      try {
        const cleaned = result.answer.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          coachNote = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Use raw content as fallback
        coachNote = { content: result.answer, priority: 5 };
      }
    }

    if (!coachNote || !coachNote.content) {
      res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Failed to generate coach note' } });
      return;
    }

    // Save the note
    const { data: savedNote, error: saveError } = await supabase
      .from('coach_notes')
      .insert({
        user_id: context.userId,
        type: noteType,
        content: coachNote.content,
        action_label: coachNote.actionLabel || null,
        action_url: coachNote.actionUrl || null,
        priority: coachNote.priority || 5,
        expires_at: noteType === 'daily'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : noteType === 'weekly'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : null,
      })
      .select()
      .single();

    if (saveError) {
      logger.error({ saveError }, 'Failed to save coach note');
      res.status(500).json({ error: { code: 'SAVE_FAILED', message: 'Failed to save coach note' } });
      return;
    }

    res.json({
      success: true,
      note: savedNote,
      usage: {
        model: agent.model,
        tokensUsed: result.totalTokens,
        durationMs: result.durationMs,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Coach generate error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

// GET /coach/notes — List coach notes
coachRouter.get('/notes', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: notes, error } = await supabase
      .from('coach_notes')
      .select('*')
      .eq('user_id', userProfile.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ success: true, notes });
  } catch (err) {
    logger.error({ err }, 'Coach notes list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});
