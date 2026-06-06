import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { getGlobalAIRateInfo } from '../lib/rate-limit.js';
import { getTokenUsage, isNvidiaConfigured } from '../lib/ai/core/nvidia.js';
import { getAIStats } from '../lib/ai/metrics.js';
import { connectionTracker } from '../lib/connection-tracker.js';

export const healthRouter = Router();

/**
 * GET /health — Basic health check (fast, no external calls)
 */
healthRouter.get('/', async (_req, res) => {
  try {
    // Lightweight DB check with 3s timeout
    const dbCheck = supabase.from('users').select('id').limit(1);
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3000)
    );

    const result = await Promise.race([
      dbCheck.then(({ error }) => ({ error })),
      timeoutPromise.then(() => ({ error: new Error('timeout') })),
    ]);

    const dbStatus = result.error ? 'error' : 'connected';
    const aiRateInfo = getGlobalAIRateInfo();
    const tokenUsage = getTokenUsage();

    res.json({
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        nvidia: isNvidiaConfigured() ? 'configured' : 'not_configured',
      },
      ai: {
        globalRateLimit: {
          current: aiRateInfo.current,
          limit: aiRateInfo.limit,
          remaining: Math.max(0, aiRateInfo.limit - aiRateInfo.current),
        },
        tokenUsage: {
          total: tokenUsage.total,
          requests: tokenUsage.requests,
        },
      },
      connections: connectionTracker.activeCount,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unreachable',
      },
    });
  }
});

/**
 * GET /health/deep — Deep health check (tests NVIDIA API connectivity)
 * Use sparingly — makes an external API call.
 */
healthRouter.get('/deep', async (_req, res) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let overallStatus = 'ok';

  // DB check
  const dbStart = Date.now();
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    checks.database = {
      status: error ? 'error' : 'ok',
      latencyMs: Date.now() - dbStart,
      ...(error && { error: error.message }),
    };
    if (error) overallStatus = 'degraded';
  } catch (err) {
    checks.database = { status: 'error', latencyMs: Date.now() - dbStart, error: 'Connection failed' };
    overallStatus = 'degraded';
  }

  // NVIDIA API check (lightweight models endpoint)
  if (isNvidiaConfigured()) {
    const nvidiaStart = Date.now();
    try {
      const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
      const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${NVIDIA_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      checks.nvidia_api = {
        status: response.ok ? 'ok' : 'error',
        latencyMs: Date.now() - nvidiaStart,
        ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
      };
      if (!response.ok) overallStatus = 'degraded';
    } catch (err) {
      checks.nvidia_api = { status: 'error', latencyMs: Date.now() - nvidiaStart, error: 'Connection failed' };
      overallStatus = 'degraded';
    }
  } else {
    checks.nvidia_api = { status: 'not_configured' };
  }

  // AI stats
  const aiStats = getAIStats();

  res.status(overallStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    ai: {
      operations: aiStats.totalOps,
      successRate: aiStats.successRate,
      avgDurationMs: aiStats.avgDurationMs,
    },
    uptime: process.uptime(),
    connections: connectionTracker.activeCount,
  });
});
