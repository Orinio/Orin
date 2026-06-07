"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
exports.jobsRouter = (0, express_1.Router)();
const createJobSchema = zod_1.z.object({
    type: zod_1.z.enum(['batch_verify', 'generate_report', 'sync_skills']),
    data: zod_1.z.record(zod_1.z.unknown()),
});
function sanitizeJob(job, _userId) {
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
exports.jobsRouter.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: userProfile } = await supabase_js_1.supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', userId)
            .single();
        if (!userProfile) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        const { data: jobs, error } = await supabase_js_1.supabase
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
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Jobs list error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
exports.jobsRouter.post('/', async (req, res) => {
    try {
        const validation = createJobSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: validation.error.issues } });
            return;
        }
        const userId = req.user?.id;
        const { type, data } = validation.data;
        const { data: userProfile } = await supabase_js_1.supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', userId)
            .single();
        if (!userProfile) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        const { data: job, error: insertError } = await supabase_js_1.supabase
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
            logger_js_1.logger.error({ jobId: job.id, err }, 'Job processing failed');
        });
        res.json({ job: sanitizeJob(job, userId) });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Job creation error');
        res.status(500).json({ error: { code: 'JOB_ERROR', message: 'Failed to create job' } });
    }
});
exports.jobsRouter.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: userProfile } = await supabase_js_1.supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', userId)
            .single();
        if (!userProfile) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        const { data: job, error } = await supabase_js_1.supabase
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
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Job fetch error');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    }
});
async function processJob(job) {
    await supabase_js_1.supabase
        .from('jobs')
        .update({ status: 'running' })
        .eq('id', job.id);
    logger_js_1.logger.info({ jobId: job.id, type: job.type }, 'Processing job');
    try {
        let result;
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
        await supabase_js_1.supabase
            .from('jobs')
            .update({
            status: 'completed',
            result,
            completed_at: new Date().toISOString(),
        })
            .eq('id', job.id);
    }
    catch (err) {
        await supabase_js_1.supabase
            .from('jobs')
            .update({
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
            completed_at: new Date().toISOString(),
        })
            .eq('id', job.id);
    }
}
async function processBatchVerify(data) {
    const { proofIds } = data;
    logger_js_1.logger.info({ count: proofIds?.length }, 'Batch verifying proofs');
    return { verified: proofIds?.length || 0 };
}
async function processGenerateReport(data) {
    const { userId } = data;
    logger_js_1.logger.info({ userId }, 'Generating user report');
    const { data: proofs } = await supabase_js_1.supabase
        .from('proof_cards')
        .select('*')
        .eq('user_id', userId);
    return { totalProofs: proofs?.length || 0 };
}
async function processSyncSkills(data) {
    const { userId } = data;
    logger_js_1.logger.info({ userId }, 'Syncing user skills');
    const { data: proofs } = await supabase_js_1.supabase
        .from('proof_cards')
        .select('skills_extracted, skills_user_added')
        .eq('user_id', userId);
    const allSkills = proofs?.flatMap(p => [
        ...(p.skills_extracted || []),
        ...(p.skills_user_added || []),
    ]) || [];
    return { totalSkills: new Set(allSkills).size };
}
//# sourceMappingURL=jobs.js.map