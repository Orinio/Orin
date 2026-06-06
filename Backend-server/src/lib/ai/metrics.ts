import { logger } from '../logger.js';
import { getRequestId } from '../request-context.js';

/**
 * Structured AI operation logger.
 * Tracks token usage, model, duration, and errors for every AI call.
 * Outputs structured logs for aggregation in production (Datadog, CloudWatch, etc.)
 */

export interface AIOperationLog {
  operation: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tokensTotal: number;
  durationMs: number;
  iterations: number;
  toolCallsCount: number;
  success: boolean;
  error?: string;
  requestId?: string;
  userId?: string;
}

// In-memory rolling stats (last 1000 operations)
const recentOps: AIOperationLog[] = [];
const MAX_RECENT = 1000;

export function logAIOperation(op: AIOperationLog): void {
  // Structured log for aggregation
  logger.info({
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
    requestId: op.requestId || getRequestId(),
    userId: op.userId,
  }, `AI operation: ${op.operation}`);

  // Store in rolling buffer for metrics endpoint
  recentOps.push(op);
  if (recentOps.length > MAX_RECENT) {
    recentOps.shift();
  }
}

export function getAIStats() {
  if (recentOps.length === 0) {
    return { totalOps: 0, successRate: 0, avgDurationMs: 0, totalTokens: 0, byModel: {}, byOperation: {} };
  }

  const successful = recentOps.filter(o => o.success);
  const totalTokens = recentOps.reduce((sum, o) => sum + o.tokensTotal, 0);
  const avgDuration = recentOps.reduce((sum, o) => sum + o.durationMs, 0) / recentOps.length;

  // Group by model
  const byModel: Record<string, { count: number; tokens: number; avgDurationMs: number }> = {};
  for (const op of recentOps) {
    if (!byModel[op.model]) byModel[op.model] = { count: 0, tokens: 0, avgDurationMs: 0 };
    byModel[op.model].count++;
    byModel[op.model].tokens += op.tokensTotal;
    byModel[op.model].avgDurationMs += op.durationMs;
  }
  for (const model of Object.keys(byModel)) {
    byModel[model].avgDurationMs = Math.round(byModel[model].avgDurationMs / byModel[model].count);
  }

  // Group by operation
  const byOperation: Record<string, { count: number; successRate: number; avgDurationMs: number }> = {};
  for (const op of recentOps) {
    if (!byOperation[op.operation]) byOperation[op.operation] = { count: 0, successRate: 0, avgDurationMs: 0 };
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

export function clearAIStats(): void {
  recentOps.length = 0;
}
