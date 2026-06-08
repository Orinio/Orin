"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgent = runAgent;
exports.runAgentStream = runAgentStream;
const nvidia_js_1 = require("./nvidia.js");
const tool_registry_js_1 = require("./tool-registry.js");
const metrics_js_1 = require("../metrics.js");
const request_context_js_1 = require("../../request-context.js");
const utils_js_1 = require("./utils.js");
const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1500;
const DEFAULT_TOOL_TIMEOUT_MS = 20000;
function buildContextualQuery(query, context) {
    const profileInfo = context.userProfile
        ? `\nUser: ${context.userProfile.full_name || context.userProfile.username} | College: ${context.userProfile.college || 'N/A'} | Year: ${context.userProfile.year || 'N/A'}`
        : '';
    const proofInfo = context.proofs?.length
        ? `\nPortfolio: ${context.proofs.length} proofs, ${context.proofs.filter((p) => p.verification_status === 'verified').length} verified`
        : '';
    return `${profileInfo}${proofInfo}\n\nQuery: ${query}`;
}
async function runAgent(agent, query, context) {
    const startTime = Date.now();
    if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
        return {
            agentId: agent.id,
            answer: 'AI service is not configured. Please try again later.',
            thinking: '',
            toolCalls: [],
            iterations: 0,
            totalTokens: 0,
            model: agent.model,
            durationMs: 0,
        };
    }
    const tools = (0, tool_registry_js_1.getToolsByNames)(agent.tools);
    const openAITools = tools.length > 0 ? (0, tool_registry_js_1.toolsToOpenAITools)(agent.tools) : undefined;
    const truncatedQuery = query.length > MAX_INPUT_LENGTH
        ? query.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
        : query;
    const messages = [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: buildContextualQuery(truncatedQuery, context) },
    ];
    const toolCalls = [];
    let iterations = 0;
    let totalTokens = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    let finalAnswer = '';
    let thinking = '';
    const agentStartTime = Date.now();
    while (iterations < agent.maxIterations) {
        iterations++;
        if (Date.now() - agentStartTime > agent.timeoutMs) {
            thinking = `Agent timeout after ${agent.timeoutMs}ms`;
            finalAnswer = finalAnswer || 'The operation took too long. Please try a simpler request.';
            break;
        }
        const response = await (0, nvidia_js_1.chatCompletion)({
            model: agent.model,
            messages,
            temperature: agent.temperature,
            max_tokens: agent.maxTokens,
            ...(openAITools ? { tools: openAITools, tool_choice: 'auto' } : {}),
        });
        const message = response.choices[0]?.message;
        totalTokens += response.usage?.total_tokens || 0;
        totalTokensIn += response.usage?.prompt_tokens || 0;
        totalTokensOut += response.usage?.completion_tokens || 0;
        if (!message)
            break;
        // Native tool calls from the model
        if (message.tool_calls && message.tool_calls.length > 0) {
            messages.push({
                role: 'assistant',
                content: message.content,
                tool_calls: message.tool_calls,
            });
            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                const tool = tools.find(t => t.name === toolName);
                if (!tool) {
                    toolCalls.push({
                        tool: toolName,
                        args: {},
                        result: { success: false, error: `Tool '${toolName}' not found` },
                    });
                    messages.push({
                        role: 'tool',
                        content: JSON.stringify({ error: `Tool '${toolName}' does not exist. Available: ${tools.map(t => t.name).join(', ')}` }),
                        tool_call_id: toolCall.id,
                        name: toolName,
                    });
                    continue;
                }
                let args;
                try {
                    args = JSON.parse(toolCall.function.arguments);
                }
                catch {
                    args = {};
                }
                const toolTimeout = tool.timeoutMs || DEFAULT_TOOL_TIMEOUT_MS;
                let result;
                try {
                    result = await Promise.race([
                        tool.execute(args),
                        new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${toolName} timed out after ${toolTimeout}ms`)), toolTimeout))
                    ]);
                }
                catch (err) {
                    result = { success: false, error: err instanceof Error ? err.message : 'Tool execution failed' };
                }
                toolCalls.push({ tool: toolName, args, result });
                const resultStr = JSON.stringify(result).substring(0, MAX_TOOL_RESULT_LENGTH);
                messages.push({
                    role: 'tool',
                    content: resultStr,
                    tool_call_id: toolCall.id,
                    name: toolName,
                });
            }
            continue;
        }
        // Text response — final answer
        if (message.content) {
            finalAnswer = (0, utils_js_1.sanitizeAnswer)(message.content);
            break;
        }
        break;
    }
    const durationMs = Date.now() - startTime;
    (0, metrics_js_1.logAIOperation)({
        operation: agent.id,
        model: agent.model,
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
        tokensTotal: totalTokens,
        durationMs,
        iterations,
        toolCallsCount: toolCalls.length,
        success: !!finalAnswer,
        requestId: (0, request_context_js_1.getRequestId)(),
        userId: (0, request_context_js_1.getUserId)(),
    });
    return {
        agentId: agent.id,
        answer: finalAnswer,
        thinking,
        toolCalls,
        iterations,
        totalTokens,
        model: agent.model,
        durationMs,
    };
}
async function runAgentStream(agent, query, context, onChunk) {
    if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
        onChunk('AI service is not configured. Please try again later.');
        return;
    }
    const truncatedQuery = query.length > MAX_INPUT_LENGTH
        ? query.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
        : query;
    const messages = [
        { role: 'system', content: agent.systemPrompt },
        ...(context.conversationHistory?.slice(-6) || []),
        { role: 'user', content: buildContextualQuery(truncatedQuery, context) },
    ];
    const stream = (0, nvidia_js_1.chatCompletionStream)({
        model: agent.model,
        messages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        stream: true,
    });
    for await (const chunk of stream) {
        onChunk(chunk);
    }
}
//# sourceMappingURL=agent-runner.js.map