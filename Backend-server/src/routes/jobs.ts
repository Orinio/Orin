import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { resolveOrgContext, getQueryScope } from '../middleware/org-scoping.js';

export const jobsRouter = Router();

// Apply org context resolution to all jobs routes
jobsRouter.use(resolveOrgContext);

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
    orgId: job.org_id,
    createdAt: job.created_at,
    completedAt: job.completed_at,
  };
}

jobsRouter.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;

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

    const scope = getQueryScope(req);

    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Scope by org or user
    if (scope.orgId) {
      query = query.eq('org_id', scope.orgId);
    } else {
      query = query.eq('user_id', userProfile.id);
    }

    const { data: jobs, error } = await query;

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

    const userId = req.user?.id;
    const { type, data } = validation.data;

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

    const scope = getQueryScope(req);

    const { data: job, error: insertError } = await supabase
      .from('jobs')
      .insert({
        user_id: userProfile.id,
        org_id: scope.orgId,
        type,
        status: 'pending',
        data: { ...data, userId: userProfile.id, orgId: scope.orgId },
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
    const userId = req.user?.id;

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

    const scope = getQueryScope(req);

    let query = supabase
      .from('jobs')
      .select('*')
      .eq('id', req.params.id);

    if (scope.orgId) {
      query = query.eq('org_id', scope.orgId);
    } else {
      query = query.eq('user_id', userProfile.id);
    }

    const { data: job, error } = await query.single();

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

async function processBatchVerify(data: Record<string, unknown>) {
  const proofIds = data.proofIds as string[] | undefined;
  if (!proofIds?.length) return { verified: 0, failed: 0, errors: [] };

  logger.info({ count: proofIds.length }, 'Batch verifying proofs');

  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('id, source_url, source_type, user_id')
    .in('id', proofIds);

  if (!proofs?.length) return { verified: 0, failed: 0, errors: ['No proofs found'] };

  let verified = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const proof of proofs) {
    try {
      if (!proof.source_url) {
        failed++;
        errors.push(`Proof ${proof.id}: no source_url`);
        continue;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(proof.source_url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      const isValid = resp.ok || resp.status === 403 || resp.status === 429;

      await supabase
        .from('proof_cards')
        .update({
          verification_status: isValid ? 'verified' : 'rejected',
          verified_at: isValid ? new Date().toISOString() : null,
          metadata: {
            batch_verify: {
              timestamp: new Date().toISOString(),
              httpStatus: resp.status,
              method: 'batch_verify',
            },
          },
        })
        .eq('id', proof.id);

      if (isValid) verified++;
      else {
        failed++;
        errors.push(`Proof ${proof.id}: HTTP ${resp.status}`);
      }
    } catch (err) {
      failed++;
      errors.push(`Proof ${proof.id}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  return { verified, failed, errors };
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
