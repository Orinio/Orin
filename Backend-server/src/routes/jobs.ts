import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export const jobsRouter = Router();

const createJobSchema = z.object({
  type: z.enum(['batch_verify', 'generate_report', 'sync_skills']),
  data: z.record(z.unknown()),
});

function sanitizeJob(job: any, _userId: string) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.created_at,
    completedAt: job.completed_at,
  };
}

jobsRouter.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: error.message } });
      return;
    }

    res.json({ jobs: (jobs || []).map(j => sanitizeJob(j, userId)) });
  } catch (err) {
    logger.error({ err }, 'Jobs list error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

jobsRouter.post('/', async (req, res) => {
  try {
    const validation = createJobSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
      return;
    }

    const userId = (req as any).user?.id;
    const { type, data } = validation.data;

    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: userProfile.id,
        type,
        status: 'pending',
        data: { ...data, userId: userProfile.id },
      })
      .select()
      .single();

    if (insertError) {
      res.status(500).json({ error: { code: 'DB_ERROR', message: insertError.message } });
      return;
    }

    processJob(job).catch(err => {
      logger.error({ jobId: job.id, err }, 'Job processing failed');
    });

    res.json({ job: sanitizeJob(job, userId) });
  } catch (err) {
    logger.error({ err }, 'Job creation error');
    res.status(500).json({ error: { code: 'JOB_ERROR', message: 'Failed to create job' } });
  }
});

jobsRouter.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    const { data: userProfile } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (!userProfile) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userProfile.id)
      .single();

    if (error || !job) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
      return;
    }

    res.json({ job: sanitizeJob(job, userId) });
  } catch (err) {
    logger.error({ err }, 'Job fetch error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

async function processJob(job: any) {
  await supabase
    .from('jobs')
    .update({ status: 'running' })
    .eq('id', job.id);

  logger.info({ jobId: job.id, type: job.type }, 'Processing job');

  try {
    let result: any;
    switch (job.type) {
      case 'batch_verify':
        result = await processBatchVerify(job.data);
        break;
      case 'generate_report':
        result = await processGenerateReport(job.data);
        break;
      case 'sync_skills':
        result = await processSyncSkills(job.data);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  } catch (err) {
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}

async function processBatchVerify(data: any) {
  const { proofIds } = data;
  logger.info({ count: proofIds?.length }, 'Batch verifying proofs');
  return { verified: proofIds?.length || 0 };
}

async function processGenerateReport(data: any) {
  const { userId } = data;
  logger.info({ userId }, 'Generating user report');

  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('*')
    .eq('user_id', userId);

  return { totalProofs: proofs?.length || 0 };
}

async function processSyncSkills(data: any) {
  const { userId } = data;
  logger.info({ userId }, 'Syncing user skills');

  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('skills_extracted, skills_user_added')
    .eq('user_id', userId);

  const allSkills = proofs?.flatMap(p => [
    ...(p.skills_extracted || []),
    ...(p.skills_user_added || []),
  ]) || [];

  return { totalSkills: new Set(allSkills).size };
}
