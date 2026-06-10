"use strict";
/**
 * Orin AI - Agent Orchestrator
 * Manages multiple AI agents working together with memory, native tool calling, and streaming
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = exports.AGENTS = void 0;
exports.createOrchestrator = createOrchestrator;
const uuid_1 = require("uuid");
const logger_js_1 = require("../../logger.js");
const nvidia_js_1 = require("../core/nvidia.js");
const memory_manager_js_1 = require("../memory/memory-manager.js");
const tool_registry_js_1 = require("../core/tool-registry.js");
const context_js_1 = require("../../context.js");
const index_js_1 = require("../agents/index.js");
const utils_js_1 = require("../core/utils.js");
const metrics_js_1 = require("../metrics.js");
const request_context_js_1 = require("../../request-context.js");
const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1500;
const DEFAULT_TOOL_TIMEOUT_MS = 20000;
// ============================================================
// Intent → Agent routing map
// ============================================================
const INTENT_AGENT_MAP = {
    coaching: 'coach',
    skills: 'skill-analysis',
    opportunities: 'opportunity-matcher',
    learning: 'learning-path',
    portfolio: 'portfolio-scorer',
    verification: 'verification',
    general: 'chat',
};
// ============================================================
// Pre-defined Agents — single source of truth from agents/*.agent.ts
// ============================================================
const agentList = (0, index_js_1.getAllAgents)();
exports.AGENTS = Object.fromEntries(agentList.map(a => [a.id, a]));
// ============================================================
// Agent Orchestrator Class
// ============================================================
class AgentOrchestrator {
    agents = new Map();
    memoryManager = null;
    sessionId;
    constructor(userId) {
        this.sessionId = (0, uuid_1.v4)();
        // Register all agents
        for (const agent of Object.values(exports.AGENTS)) {
            this.agents.set(agent.id, agent);
        }
        // Initialize memory manager if userId provided
        if (userId) {
            this.memoryManager = (0, memory_manager_js_1.createMemoryManager)(userId);
        }
    }
    // ------------------------------------------------------------
    // Intent Routing
    // ------------------------------------------------------------
    /**
     * Classify user intent using the router agent (cheap nano model).
     * Returns the agent ID to route to.
     */
    async routeQuery(query) {
        const routerAgentDef = (0, index_js_1.getAgent)('router');
        if (!routerAgentDef || !(0, nvidia_js_1.isNvidiaConfigured)()) {
            return { agentId: 'chat', category: 'general', confidence: 0.5 };
        }
        try {
            const response = await (0, nvidia_js_1.chatCompletion)({
                model: routerAgentDef.model,
                messages: [
                    { role: 'system', content: routerAgentDef.systemPrompt },
                    { role: 'user', content: query }
                ],
                temperature: 0.1,
                max_tokens: 100,
            });
            const content = response.choices[0]?.message?.content || '';
            const parsed = (() => {
                try {
                    return JSON.parse(content);
                }
                catch {
                    return null;
                }
            })();
            if (parsed?.category && INTENT_AGENT_MAP[parsed.category]) {
                const agentId = INTENT_AGENT_MAP[parsed.category];
                logger_js_1.logger.info({ query: query.substring(0, 50), category: parsed.category, agentId, confidence: parsed.confidence }, 'Intent routed');
                return {
                    agentId,
                    category: parsed.category,
                    confidence: parsed.confidence || 0.8
                };
            }
        }
        catch (error) {
            logger_js_1.logger.warn({ error }, 'Intent classification failed, falling back to chat');
        }
        return { agentId: 'chat', category: 'general', confidence: 0.5 };
    }
    // ------------------------------------------------------------
    // Single Agent Execution
    // ------------------------------------------------------------
    async runAgent(agentId, query, context) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent '${agentId}' not found`);
        }
        const startTime = Date.now();
        const tools = (0, tool_registry_js_1.getToolsByNames)(agent.tools);
        // Build messages
        const messages = [
            { role: 'system', content: agent.systemPrompt }
        ];
        // Add context from memory if available
        if (this.memoryManager) {
            const memoryContext = await this.memoryManager.buildAgentContext();
            messages[0].content += `\n\n${memoryContext}`;
        }
        // Add user profile context
        if (context?.authUserId || context?.userId) {
            try {
                const userProfile = await (0, context_js_1.buildAgentContext)(context.authUserId || context.userId);
                if (userProfile) {
                    messages[0].content += `\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2).substring(0, 2000)}`;
                }
            }
            catch (err) {
                logger_js_1.logger.warn({ err }, 'Failed to load user profile for runAgent');
            }
        }
        // Add conversation history (last 6 messages for context window)
        if (context?.conversationHistory?.length) {
            messages.push(...context.conversationHistory.slice(-6));
        }
        // Add user query
        messages.push({ role: 'user', content: query });
        // Convert tools to OpenAI format for native tool calling
        const openAITools = tools.length > 0 ? (0, tool_registry_js_1.toolsToOpenAITools)(agent.tools) : undefined;
        // Execute with native tool calling loop
        let iterations = 0;
        let totalTokens = 0;
        let finalAnswer = '';
        let thinking = '';
        const toolCalls = [];
        while (iterations < agent.maxIterations) {
            iterations++;
            const response = await (0, nvidia_js_1.chatCompletion)({
                model: agent.model,
                messages,
                temperature: agent.temperature,
                max_tokens: agent.maxTokens,
                ...(openAITools ? { tools: openAITools, tool_choice: 'auto' } : {}),
            });
            const choice = response.choices[0];
            const message = choice?.message;
            totalTokens += response.usage?.total_tokens || 0;
            if (!message)
                break;
            // Case 1: Model wants to call tools (native tool_calls in response)
            if (message.tool_calls && message.tool_calls.length > 0) {
                // Add the assistant message with tool_calls to history
                messages.push({
                    role: 'assistant',
                    content: message.content,
                    tool_calls: message.tool_calls,
                });
                // Execute each tool call
                for (const toolCall of message.tool_calls) {
                    const toolName = toolCall.function.name;
                    const tool = tools.find(t => t.name === toolName);
                    if (!tool) {
                        // Tool not found — tell the model
                        messages.push({
                            role: 'tool',
                            content: JSON.stringify({ error: `Tool '${toolName}' not found. Available tools: ${tools.map(t => t.name).join(', ')}` }),
                            tool_call_id: toolCall.id,
                            name: toolName,
                        });
                        continue;
                    }
                    // Parse arguments from the model's JSON string
                    let args;
                    try {
                        args = JSON.parse(toolCall.function.arguments);
                    }
                    catch {
                        args = {};
                        logger_js_1.logger.warn({ toolName, rawArgs: toolCall.function.arguments }, 'Failed to parse tool arguments');
                    }
                    // Execute the tool with budget-aware timeout
                    // Budget = min(tool timeout, remaining agent time - 15s buffer for next model call)
                    const elapsed = Date.now() - startTime;
                    const remainingBudget = agent.timeoutMs - elapsed - 15000; // 15s buffer for model response
                    const toolTimeout = Math.min(tool.timeoutMs || DEFAULT_TOOL_TIMEOUT_MS, Math.max(remainingBudget, 5000) // At least 5s per tool
                    );
                    let result;
                    try {
                        result = await Promise.race([
                            tool.execute(args, { userId: context?.userId }),
                            new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${toolName} timed out after ${toolTimeout}ms`)), toolTimeout))
                        ]);
                    }
                    catch (err) {
                        result = { success: false, error: err instanceof Error ? err.message : 'Tool execution failed' };
                    }
                    toolCalls.push({ tool: toolName, args, result });
                    // Feed tool result back to the model as a tool message
                    const resultStr = JSON.stringify(result).substring(0, MAX_TOOL_RESULT_LENGTH);
                    messages.push({
                        role: 'tool',
                        content: resultStr,
                        tool_call_id: toolCall.id,
                        name: toolName,
                    });
                }
                continue; // Next iteration — model will process tool results
            }
            // Case 2: Model returned text content — this is the final answer
            if (message.content) {
                finalAnswer = (0, utils_js_1.sanitizeAnswer)(message.content);
                break;
            }
            // Case 3: Empty response — break to avoid infinite loop
            break;
        }
        const durationMs = Date.now() - startTime;
        // Structured AI operation log
        (0, metrics_js_1.logAIOperation)({
            operation: agentId,
            model: agent.model,
            tokensIn: 0,
            tokensOut: 0,
            tokensTotal: totalTokens,
            durationMs,
            iterations,
            toolCallsCount: toolCalls.length,
            success: !!finalAnswer,
            requestId: (0, request_context_js_1.getRequestId)(),
            userId: context?.userId,
        });
        // Save to memory if available
        if (this.memoryManager && context?.userId) {
            await this.memoryManager.saveConversation(this.sessionId, [
                { role: 'user', content: query },
                { role: 'assistant', content: finalAnswer }
            ]);
        }
        // Extract visual specs from render_visual tool calls
        const visualSpecs = toolCalls
            .filter(tc => tc.tool === 'render_visual' && tc.result.success && tc.result.data?.visualSpec)
            .map(tc => tc.result.data.visualSpec);
        return {
            agentId,
            answer: finalAnswer,
            thinking,
            toolCalls,
            iterations,
            tokensUsed: totalTokens,
            durationMs,
            ...(visualSpecs.length > 0 ? { visualSpecs } : {}),
        };
    }
    // ------------------------------------------------------------
    // Streaming Agent Execution with Native Tool Calling
    // ------------------------------------------------------------
    /**
     * Run an agent with streaming that emits structured events:
     * - 'thinking': Agent's reasoning
     * - 'tool_start': Tool is about to be called
     * - 'tool_result': Tool call completed
     * - 'answer': Answer text chunk
     * - 'complete': Final result with all data
     */
    async runAgentStream(agentId, query, context, onEvent) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            onEvent('error', { message: `Agent '${agentId}' not found` });
            return;
        }
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            onEvent('answer', { content: 'AI service is not configured. Please try again later.' });
            onEvent('complete', { answer: 'AI service is not configured.' });
            return;
        }
        const startTime = Date.now();
        const tools = (0, tool_registry_js_1.getToolsByNames)(agent.tools);
        // Build system prompt with memory context
        let systemPrompt = agent.systemPrompt;
        // Add memory context
        if (this.memoryManager) {
            try {
                const memoryContext = await this.memoryManager.buildAgentContext();
                if (memoryContext) {
                    systemPrompt += `\n\n${memoryContext}`;
                }
            }
            catch (err) {
                logger_js_1.logger.warn({ err }, 'Failed to load memory context');
            }
        }
        // Fetch full user data from Supabase for rich context
        if (context.authUserId || context.userId) {
            try {
                const userProfile = await (0, context_js_1.buildAgentContext)(context.authUserId || context.userId);
                if (userProfile) {
                    systemPrompt += `\n\nFull User Profile from Database:\n${JSON.stringify(userProfile, null, 2).substring(0, 2000)}`;
                }
            }
            catch (err) {
                logger_js_1.logger.warn({ err }, 'Failed to load user profile');
            }
        }
        // Truncate query if too long
        const truncatedQuery = query.length > MAX_INPUT_LENGTH
            ? query.substring(0, MAX_INPUT_LENGTH) + '... (truncated)'
            : query;
        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];
        // Add conversation history
        if (context.conversationHistory) {
            messages.push(...context.conversationHistory.slice(-6));
        }
        // Add user query with context
        const profileInfo = context.userId ? `\nUser ID: ${context.userId}` : '';
        messages.push({ role: 'user', content: `${profileInfo}\n\nUser Query: ${truncatedQuery}` });
        // Convert tools to OpenAI format for native tool calling
        const openAITools = tools.length > 0 ? (0, tool_registry_js_1.toolsToOpenAITools)(agent.tools) : undefined;
        // Native tool calling loop
        let iterations = 0;
        let totalTokens = 0;
        let finalAnswer = '';
        let thinking = '';
        const toolCalls = [];
        const agentStartTime = Date.now();
        while (iterations < agent.maxIterations) {
            iterations++;
            onEvent('progress', {
                iteration: iterations,
                maxIterations: agent.maxIterations,
                toolCallsSoFar: toolCalls.length,
                elapsedMs: Date.now() - agentStartTime,
            });
            // Check timeout
            if (Date.now() - agentStartTime > agent.timeoutMs) {
                onEvent('thinking', { content: `Agent timeout after ${agent.timeoutMs}ms` });
                finalAnswer = finalAnswer || 'The operation took too long. Please try a simpler request.';
                break;
            }
            try {
                const response = await (0, nvidia_js_1.chatCompletion)({
                    model: context.modelOverride || agent.model,
                    messages,
                    temperature: agent.temperature,
                    max_tokens: agent.maxTokens,
                    ...(openAITools ? { tools: openAITools, tool_choice: 'auto' } : {}),
                });
                const choice = response.choices[0];
                const message = choice?.message;
                totalTokens += response.usage?.total_tokens || 0;
                if (!message) {
                    finalAnswer = 'No response from AI service.';
                    break;
                }
                // Case 1: Model wants to call tools (native tool_calls in response)
                if (message.tool_calls && message.tool_calls.length > 0) {
                    // Add the assistant message with tool_calls to history
                    messages.push({
                        role: 'assistant',
                        content: message.content,
                        tool_calls: message.tool_calls,
                    });
                    // Execute each tool call
                    for (const toolCall of message.tool_calls) {
                        const toolName = toolCall.function.name;
                        const tool = tools.find(t => t.name === toolName);
                        if (!tool) {
                            onEvent('thinking', { content: `Tool '${toolName}' not found. Available: ${tools.map(t => t.name).join(', ')}` });
                            messages.push({
                                role: 'tool',
                                content: JSON.stringify({ error: `Tool '${toolName}' does not exist. Available: ${tools.map(t => t.name).join(', ')}` }),
                                tool_call_id: toolCall.id,
                                name: toolName,
                            });
                            continue;
                        }
                        // Parse arguments
                        let args;
                        try {
                            args = JSON.parse(toolCall.function.arguments);
                        }
                        catch {
                            args = {};
                            logger_js_1.logger.warn({ toolName, rawArgs: toolCall.function.arguments }, 'Failed to parse tool arguments');
                        }
                        onEvent('tool_start', {
                            tool: tool.name,
                            description: tool.description,
                            args,
                            step: toolCalls.length + 1,
                            totalSteps: agent.maxIterations,
                        });
                        const toolStartTime = Date.now();
                        // Budget-aware timeout: min(tool timeout, remaining agent time - 15s buffer)
                        const elapsed = Date.now() - agentStartTime;
                        const remainingBudget = agent.timeoutMs - elapsed - 15000;
                        const toolTimeout = Math.min(tool.timeoutMs || DEFAULT_TOOL_TIMEOUT_MS, Math.max(remainingBudget, 5000) // At least 5s per tool
                        );
                        let result;
                        try {
                            result = await Promise.race([
                                tool.execute(args, { userId: context.userId }),
                                new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${tool.name} timed out after ${toolTimeout}ms`)), toolTimeout))
                            ]);
                        }
                        catch (err) {
                            result = { success: false, error: err instanceof Error ? err.message : 'Tool execution failed' };
                        }
                        const toolDurationMs = Date.now() - toolStartTime;
                        toolCalls.push({ tool: tool.name, args, result });
                        onEvent('tool_result', {
                            tool: tool.name,
                            success: result.success,
                            data: result.data,
                            error: result.error,
                            durationMs: toolDurationMs,
                            step: toolCalls.length,
                        });
                        // Emit visual_spec event when render_visual tool produces a spec
                        if (tool.name === 'render_visual' && result.success && result.data?.visualSpec) {
                            onEvent('visual_spec', { spec: result.data.visualSpec });
                        }
                        // Feed tool result back to the model as a tool message
                        const resultStr = JSON.stringify(result).substring(0, MAX_TOOL_RESULT_LENGTH);
                        messages.push({
                            role: 'tool',
                            content: resultStr,
                            tool_call_id: toolCall.id,
                            name: toolName,
                        });
                    }
                    continue; // Next iteration — model will process tool results
                }
                // Case 2: Model returned text content — this is the final answer
                if (message.content) {
                    finalAnswer = (0, utils_js_1.sanitizeAnswer)(message.content);
                    // Stream the answer in chunks for smooth UX
                    const chunkSize = 20;
                    for (let i = 0; i < finalAnswer.length; i += chunkSize) {
                        onEvent('answer', { content: finalAnswer.substring(i, i + chunkSize) });
                    }
                    break;
                }
                // Case 3: Empty response
                finalAnswer = 'I was unable to generate a response.';
                onEvent('answer', { content: finalAnswer });
                break;
            }
            catch (err) {
                logger_js_1.logger.error({ err, agentId, iterations }, 'Agent streaming error');
                onEvent('thinking', { content: `Error in iteration ${iterations}: ${err instanceof Error ? err.message : 'Unknown error'}` });
                break;
            }
        }
        const durationMs = Date.now() - startTime;
        // Structured AI operation log
        (0, metrics_js_1.logAIOperation)({
            operation: `${agentId}-stream`,
            model: agent.model,
            tokensIn: 0,
            tokensOut: 0,
            tokensTotal: totalTokens,
            durationMs,
            iterations,
            toolCallsCount: toolCalls.length,
            success: !!finalAnswer,
            requestId: (0, request_context_js_1.getRequestId)(),
            userId: context?.userId,
        });
        // Save conversation to memory
        if (this.memoryManager && context.userId) {
            try {
                await this.memoryManager.saveConversation(this.sessionId, [
                    { role: 'user', content: query },
                    { role: 'assistant', content: finalAnswer }
                ]);
            }
            catch (err) {
                logger_js_1.logger.warn({ err }, 'Failed to save conversation to memory');
            }
        }
        // Send final complete event
        onEvent('complete', {
            agentId,
            agentName: agent.name,
            agentRole: agent.role,
            answer: finalAnswer,
            thinking,
            toolCalls: toolCalls.map(tc => ({
                tool: tc.tool,
                args: tc.args,
                success: tc.result.success,
                data: tc.result.data
            })),
            iterations,
            tokensUsed: totalTokens,
            durationMs,
            followUps: extractFollowUps(finalAnswer),
        });
    }
    // ------------------------------------------------------------
    // Multi-Agent Workflow Execution
    // ------------------------------------------------------------
    async runWorkflow(workflow, _initialQuery, context) {
        const results = new Map();
        const completedSteps = new Set();
        for (const step of workflow.steps) {
            // Check dependencies
            if (step.dependsOn?.some(dep => !completedSteps.has(dep))) {
                logger_js_1.logger.warn({ step: step.agentId }, 'Skipping step due to unmet dependencies');
                continue;
            }
            // Build query from previous results if needed
            let query = step.query;
            if (step.transform && step.dependsOn) {
                const previousResults = step.dependsOn
                    .map(dep => results.get(dep))
                    .filter(Boolean);
                if (previousResults.length > 0) {
                    query = step.transform(previousResults[0]);
                }
            }
            // Run agent
            const result = await this.runAgent(step.agentId, query, context);
            results.set(step.agentId, result);
            completedSteps.add(step.agentId);
        }
        return results;
    }
    // ------------------------------------------------------------
    // Pre-defined Workflows
    // ------------------------------------------------------------
    async runCareerAnalysisWorkflow(userId, query) {
        const workflow = {
            id: 'career-analysis',
            name: 'Career Analysis',
            description: 'Comprehensive career analysis with multiple agents',
            steps: [
                {
                    agentId: 'skill-analysis',
                    query: `Analyze the user's skills and profile: ${query}`
                },
                {
                    agentId: 'portfolio-scorer',
                    query: 'Score the user\'s portfolio based on their proofs and skills',
                    dependsOn: ['skill-analysis']
                },
                {
                    agentId: 'opportunity-matcher',
                    query: 'Find matching job opportunities based on the user\'s skills',
                    dependsOn: ['skill-analysis'],
                    transform: (result) => `Based on these skills: ${result.answer}, find matching opportunities`
                },
                {
                    agentId: 'learning-path',
                    query: 'Create a learning path based on skill gaps',
                    dependsOn: ['skill-analysis', 'opportunity-matcher'],
                    transform: (result) => `Based on this analysis: ${result.answer}, create a learning path`
                },
                {
                    agentId: 'coach',
                    query: 'Provide career coaching advice',
                    dependsOn: ['portfolio-scorer', 'opportunity-matcher', 'learning-path'],
                    transform: (result) => `Based on all analysis: ${result.answer}, provide final career advice`
                }
            ]
        };
        return this.runWorkflow(workflow, query, { userId });
    }
    async runProofVerificationWorkflow(userId, proofUrl, sourceType) {
        const workflow = {
            id: 'proof-verification',
            name: 'Proof Verification',
            description: 'Verify a proof source and analyze its quality',
            steps: [
                {
                    agentId: 'verification',
                    query: `Verify this ${sourceType} proof: ${proofUrl}`
                },
                {
                    agentId: 'skill-analysis',
                    query: 'Extract skills from the verified proof',
                    dependsOn: ['verification'],
                    transform: (result) => `From this verified proof: ${result.answer}, extract the technical skills demonstrated`
                }
            ]
        };
        return this.runWorkflow(workflow, proofUrl, { userId });
    }
    // ------------------------------------------------------------
    // Getters
    // ------------------------------------------------------------
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    getSessionId() {
        return this.sessionId;
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
// ============================================================
// Follow-up extraction from answer text
// ============================================================
function extractFollowUps(answer) {
    const followUps = [];
    // Look for explicit question patterns
    const questionPatterns = [
        /(?:would you like|want me to|shall I|should I|can I|may I)\s+(.+?)\??/gi,
        /(?:next|also|additionally),?\s+(.+?\?)\s/gi,
        /(?:you might also|you may want to|consider)\s+(.+?)\.?\s/gi,
    ];
    for (const pattern of questionPatterns) {
        let match;
        while ((match = pattern.exec(answer)) !== null && followUps.length < 3) {
            const suggestion = match[1].trim().replace(/\.$/, '');
            if (suggestion.length > 10 && suggestion.length < 100 && !followUps.includes(suggestion)) {
                followUps.push(suggestion.charAt(0).toUpperCase() + suggestion.slice(1));
            }
        }
    }
    // If no explicit questions found, generate contextual suggestions based on keywords
    if (followUps.length === 0) {
        const lowerAnswer = answer.toLowerCase();
        if (lowerAnswer.includes('skill') || lowerAnswer.includes('portfolio')) {
            followUps.push('What skills should I learn next?');
        }
        if (lowerAnswer.includes('job') || lowerAnswer.includes('opportunity') || lowerAnswer.includes('career')) {
            followUps.push('Show me matching opportunities');
        }
        if (lowerAnswer.includes('proof') || lowerAnswer.includes('project')) {
            followUps.push('Help me verify my latest proof');
        }
        if (lowerAnswer.includes('resume') || lowerAnswer.includes('bullet')) {
            followUps.push('Generate resume bullet points from my proofs');
        }
    }
    return followUps.slice(0, 3);
}
// ============================================================
// Factory function
// ============================================================
function createOrchestrator(userId) {
    return new AgentOrchestrator(userId);
}
exports.default = {
    AgentOrchestrator,
    createOrchestrator,
    AGENTS: exports.AGENTS
};
//# sourceMappingURL=agent-orchestrator.js.map