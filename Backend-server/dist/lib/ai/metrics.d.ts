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
export declare function logAIOperation(op: AIOperationLog): void;
export declare function getAIStats(): {
    totalOps: number;
    successRate: number;
    avgDurationMs: number;
    totalTokens: number;
    byModel: Record<string, {
        count: number;
        tokens: number;
        avgDurationMs: number;
    }>;
    byOperation: Record<string, {
        count: number;
        successRate: number;
        avgDurationMs: number;
    }>;
};
export declare function clearAIStats(): void;
//# sourceMappingURL=metrics.d.ts.map