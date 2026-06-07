"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const supabase_js_1 = require("../lib/supabase.js");
const rate_limit_js_1 = require("../lib/rate-limit.js");
const nvidia_js_1 = require("../lib/ai/core/nvidia.js");
const metrics_js_1 = require("../lib/ai/metrics.js");
const connection_tracker_js_1 = require("../lib/connection-tracker.js");
exports.healthRouter = (0, express_1.Router)();
/**
 * GET /health — Basic health check (fast, no external calls)
 */
exports.healthRouter.get('/', async (_req, res) => {
    try {
        // Lightweight DB check with 3s timeout
        const dbCheck = supabase_js_1.supabase.from('users').select('id').limit(1);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
        const result = await Promise.race([
            dbCheck.then(({ error }) => ({ error })),
            timeoutPromise.then(() => ({ error: new Error('timeout') })),
        ]);
        const dbStatus = result.error ? 'error' : 'connected';
        const aiRateInfo = (0, rate_limit_js_1.getGlobalAIRateInfo)();
        const tokenUsage = (0, nvidia_js_1.getTokenUsage)();
        res.json({
            status: dbStatus === 'connected' ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                nvidia: (0, nvidia_js_1.isNvidiaConfigured)() ? 'configured' : 'not_configured',
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
            connections: connection_tracker_js_1.connectionTracker.activeCount,
            uptime: process.uptime(),
            memory: {
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            },
        });
    }
    catch {
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
exports.healthRouter.get('/deep', async (_req, res) => {
    const checks = {};
    let overallStatus = 'ok';
    // DB check
    const dbStart = Date.now();
    try {
        const { error } = await supabase_js_1.supabase.from('users').select('id').limit(1);
        checks.database = {
            status: error ? 'error' : 'ok',
            latencyMs: Date.now() - dbStart,
            ...(error && { error: error.message }),
        };
        if (error)
            overallStatus = 'degraded';
    }
    catch (err) {
        checks.database = { status: 'error', latencyMs: Date.now() - dbStart, error: 'Connection failed' };
        overallStatus = 'degraded';
    }
    // NVIDIA API check (lightweight models endpoint)
    if ((0, nvidia_js_1.isNvidiaConfigured)()) {
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
            if (!response.ok)
                overallStatus = 'degraded';
        }
        catch (err) {
            checks.nvidia_api = { status: 'error', latencyMs: Date.now() - nvidiaStart, error: 'Connection failed' };
            overallStatus = 'degraded';
        }
    }
    else {
        checks.nvidia_api = { status: 'not_configured' };
    }
    // AI stats
    const aiStats = (0, metrics_js_1.getAIStats)();
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
        connections: connection_tracker_js_1.connectionTracker.activeCount,
    });
});
//# sourceMappingURL=health.js.map