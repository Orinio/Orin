"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAIOperation = logAIOperation;
exports.getAIStats = getAIStats;
exports.clearAIStats = clearAIStats;
const logger_js_1 = require("../logger.js");
const request_context_js_1 = require("../request-context.js");
// In-memory rolling stats (last 1000 operations)
const recentOps = [];
const MAX_RECENT = 1000;
function logAIOperation(op) {
    // Structured log for aggregation
    logger_js_1.logger.info({
        ai: {
            operation: op.operation,
            model: op.model,
            tokens: { in: op.tokensIn, out: op.tokensOut, total: op.tokensTotal },
            durationMs: op.durationMs,
            iterations: op.iterations,
            toolCalls: op.toolCallsCount,
            success: op.success,
            ...(op.error && { error: op.error }),
        },
        requestId: op.requestId || (0, request_context_js_1.getRequestId)(),
        userId: op.userId,
    }, `AI operation: ${op.operation}`);
    // Store in rolling buffer for metrics endpoint
    recentOps.push(op);
    if (recentOps.length > MAX_RECENT) {
        recentOps.shift();
    }
}
function getAIStats() {
    if (recentOps.length === 0) {
        return { totalOps: 0, successRate: 0, avgDurationMs: 0, totalTokens: 0, byModel: {}, byOperation: {} };
    }
    const successful = recentOps.filter(o => o.success);
    const totalTokens = recentOps.reduce((sum, o) => sum + o.tokensTotal, 0);
    const avgDuration = recentOps.reduce((sum, o) => sum + o.durationMs, 0) / recentOps.length;
    // Group by model
    const byModel = {};
    for (const op of recentOps) {
        if (!byModel[op.model])
            byModel[op.model] = { count: 0, tokens: 0, avgDurationMs: 0 };
        byModel[op.model].count++;
        byModel[op.model].tokens += op.tokensTotal;
        byModel[op.model].avgDurationMs += op.durationMs;
    }
    for (const model of Object.keys(byModel)) {
        byModel[model].avgDurationMs = Math.round(byModel[model].avgDurationMs / byModel[model].count);
    }
    // Group by operation
    const byOperation = {};
    for (const op of recentOps) {
        if (!byOperation[op.operation])
            byOperation[op.operation] = { count: 0, successRate: 0, avgDurationMs: 0 };
        byOperation[op.operation].count++;
        byOperation[op.operation].successRate += op.success ? 1 : 0;
        byOperation[op.operation].avgDurationMs += op.durationMs;
    }
    for (const opName of Object.keys(byOperation)) {
        const stats = byOperation[opName];
        stats.successRate = Math.round((stats.successRate / stats.count) * 100);
        stats.avgDurationMs = Math.round(stats.avgDurationMs / stats.count);
    }
    return {
        totalOps: recentOps.length,
        successRate: Math.round((successful.length / recentOps.length) * 100),
        avgDurationMs: Math.round(avgDuration),
        totalTokens,
        byModel,
        byOperation,
    };
}
function clearAIStats() {
    recentOps.length = 0;
}
//# sourceMappingURL=metrics.js.map