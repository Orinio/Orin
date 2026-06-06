import { Router } from 'express';
import { getAIStats } from '../lib/ai/metrics.js';
import { getGlobalAIRateInfo } from '../lib/rate-limit.js';
import { getTokenUsage, isNvidiaConfigured } from '../lib/ai/core/nvidia.js';
import { supabase } from '../lib/supabase.js';

export const metricsRouter = Router();

/**
 * GET /metrics — Prometheus-compatible metrics endpoint
 * Returns AI usage stats, rate limits, token consumption, and system metrics.
 */
metricsRouter.get('/', async (_req, res) => {
  try {
    const aiStats = getAIStats();
    const rateInfo = getGlobalAIRateInfo();
    const tokenUsage = getTokenUsage();

    // Database stats
    let dbStats = { users: 0, proofs: 0, coachNotes: 0 };
    try {
      const [usersResult, proofsResult, notesResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('proof_cards').select('id', { count: 'exact', head: true }),
        supabase.from('coach_notes').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      ]);
      dbStats = {
        users: usersResult.count || 0,
        proofs: proofsResult.count || 0,
        coachNotes: notesResult.count || 0,
      };
    } catch {
      // DB stats are best-effort
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      ai: {
        nvidia: isNvidiaConfigured() ? 'configured' : 'not_configured',
        rateLimit: {
          current: rateInfo.current,
          limit: rateInfo.limit,
          remaining: Math.max(0, rateInfo.limit - rateInfo.current),
        },
        tokens: {
          total: tokenUsage.total,
          prompt: tokenUsage.prompt,
          completion: tokenUsage.completion,
          requests: tokenUsage.requests,
        },
        operations: {
          total: aiStats.totalOps,
          successRate: aiStats.successRate,
          avgDurationMs: aiStats.avgDurationMs,
          byModel: aiStats.byModel,
          byOperation: aiStats.byOperation,
        },
      },
      database: dbStats,
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: { code: 'METRICS_ERROR', message: 'Failed to collect metrics' } });
  }
});

/**
 * GET /metrics/prometheus — Prometheus text format
 */
metricsRouter.get('/prometheus', async (_req, res) => {
  try {
    const aiStats = getAIStats();
    const rateInfo = getGlobalAIRateInfo();
    const tokenUsage = getTokenUsage();

    const lines = [
      '# HELP orin_ai_tokens_total Total tokens used by AI operations',
      '# TYPE orin_ai_tokens_total counter',
      `orin_ai_tokens_total ${tokenUsage.total}`,
      '',
      '# HELP orin_ai_requests_total Total AI API requests',
      '# TYPE orin_ai_requests_total counter',
      `orin_ai_requests_total ${tokenUsage.requests}`,
      '',
      '# HELP orin_ai_rate_limit_remaining Remaining AI rate limit',
      '# TYPE orin_ai_rate_limit_remaining gauge',
      `orin_ai_rate_limit_remaining ${Math.max(0, rateInfo.limit - rateInfo.current)}`,
      '',
      '# HELP orin_ai_rate_limit_total AI rate limit',
      '# TYPE orin_ai_rate_limit_total gauge',
      `orin_ai_rate_limit_total ${rateInfo.limit}`,
      '',
      '# HELP orin_ai_operation_duration_ms Average AI operation duration',
      '# TYPE orin_ai_operation_duration_ms gauge',
      `orin_ai_operation_duration_ms ${aiStats.avgDurationMs}`,
      '',
      '# HELP orin_ai_success_rate AI operation success rate percentage',
      '# TYPE orin_ai_success_rate gauge',
      `orin_ai_success_rate ${aiStats.successRate}`,
      '',
      '# HELP orin_memory_rss_bytes Resident Set Size memory',
      '# TYPE orin_memory_rss_bytes gauge',
      `orin_memory_rss_bytes ${process.memoryUsage().rss}`,
      '',
      '# HELP orin_memory_heap_used_bytes Heap used memory',
      '# TYPE orin_memory_heap_used_bytes gauge',
      `orin_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`,
      '',
      '# HELP orin_uptime_seconds Server uptime',
      '# TYPE orin_uptime_seconds gauge',
      `orin_uptime_seconds ${Math.round(process.uptime())}`,
    ];

    // Per-model metrics
    for (const [model, stats] of Object.entries(aiStats.byModel)) {
      const safeName = model.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push('');
      lines.push(`# HELP orin_ai_model_${safeName}_tokens Tokens used by ${model}`);
      lines.push(`# TYPE orin_ai_model_${safeName}_tokens counter`);
      lines.push(`orin_ai_model_${safeName}_tokens ${stats.tokens}`);
    }

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).send('# Metrics collection failed\n');
  }
});
