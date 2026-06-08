"use strict";
/**
 * Orin AI - Comprehensive Agent Routes
 * Exposes all AI agent capabilities to the frontend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRouter = void 0;
const express_1 = require("express");
const logger_js_1 = require("../lib/logger.js");
const nvidia_js_1 = require("../lib/ai/core/nvidia.js");
const agent_orchestrator_js_1 = require("../lib/ai/orchestrator/agent-orchestrator.js");
const memory_manager_js_1 = require("../lib/ai/memory/memory-manager.js");
const tool_registry_js_1 = require("../lib/ai/core/tool-registry.js");
const rate_limit_js_1 = require("../middleware/rate-limit.js");
exports.agentRouter = (0, express_1.Router)();
// ============================================================
// Agent Management Routes
// ============================================================
/**
 * GET /ai/agents - List all available agents
 */
exports.agentRouter.get('/agents', async (_req, res) => {
    try {
        const agents = Object.values(agent_orchestrator_js_1.AGENTS).map(agent => ({
            id: agent.id,
            name: agent.name,
            role: agent.role,
            model: agent.model,
            tools: agent.tools,
            description: agent.systemPrompt.split('\n')[0]
        }));
        res.json({ success: true, data: { agents } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to list agents');
        res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to list agents' } });
    }
});
/**
 * GET /ai/agents/:id - Get agent details
 */
exports.agentRouter.get('/agents/:id', async (req, res) => {
    try {
        const agent = agent_orchestrator_js_1.AGENTS[req.params.id];
        if (!agent) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Agent not found' } });
            return;
        }
        res.json({
            success: true,
            data: {
                id: agent.id,
                name: agent.name,
                role: agent.role,
                model: agent.model,
                tools: agent.tools,
                systemPrompt: agent.systemPrompt,
                temperature: agent.temperature,
                maxTokens: agent.maxTokens
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to get agent');
        res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to get agent' } });
    }
});
// ============================================================
// Agent Execution Routes
// ============================================================
/**
 * POST /ai/agents/chat - Run the chat agent
 * (Must be before /agents/:id to avoid matching "chat" as :id)
 */
exports.agentRouter.post('/agents/chat', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-agents-chat'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { query, conversationHistory } = req.body;
        const userId = req.user?.id;
        if (!query) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
            return;
        }
        const orchestrator = (0, agent_orchestrator_js_1.createOrchestrator)(userId);
        const result = await orchestrator.runAgent('chat', query, {
            userId,
            conversationHistory
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to run chat agent');
        res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to run chat' } });
    }
});
/**
 * POST /ai/agents/chat/stream - Stream chat responses with real SSE streaming
 * (Must be before /agents/:id to avoid matching "chat" as :id)
 */
exports.agentRouter.post('/agents/chat/stream', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-agents-stream'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { query, conversationHistory, attachments } = req.body;
        const userId = req.user?.id;
        if (!query) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
            return;
        }
        // Analyze image attachments if present
        let enrichedQuery = query;
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
            const imageAttachments = attachments.filter((a) => a.type?.startsWith('image/'));
            if (imageAttachments.length > 0) {
                try {
                    const { analyzeImage } = await import('../lib/ai/services/vision.service.js');
                    const analyses = await Promise.all(imageAttachments.map(async (att) => {
                        try {
                            const result = await analyzeImage(att.base64, `Analyze this image in context of the user's question: ${query}`);
                            return `[Image: ${att.name}] ${result}`;
                        }
                        catch {
                            return `[Image: ${att.name}] (unable to analyze)`;
                        }
                    }));
                    enrichedQuery = `${query}\n\nAttached images:\n${analyses.join('\n')}`;
                }
                catch {
                    // Vision service unavailable, continue without image analysis
                }
            }
        }
        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        const sendEvent = (event, data) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };
        // Handle client disconnect
        let aborted = false;
        req.on('close', () => { aborted = true; });
        // Send initial event
        sendEvent('start', { agentId: 'chat', query });
        try {
            const orchestrator = (0, agent_orchestrator_js_1.createOrchestrator)(userId);
            // Auto-route: classify intent and pick the best agent (use original query for classification)
            let agentId = 'chat';
            try {
                const routing = await orchestrator.routeQuery(query);
                agentId = routing.agentId;
                sendEvent('progress', { routing: { category: routing.category, confidence: routing.confidence, agentId } });
            }
            catch {
                // Fallback to chat if routing fails
            }
            await orchestrator.runAgentStream(agentId, enrichedQuery, { userId, conversationHistory }, (event, data) => {
                if (!aborted)
                    sendEvent(event, data);
            });
        }
        catch (error) {
            if (!aborted)
                sendEvent('error', { message: 'Failed to process request' });
        }
        if (!aborted) {
            res.write('event: end\ndata: {}\n\n');
            res.end();
        }
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to stream chat');
        if (!res.headersSent) {
            res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to stream chat' } });
        }
    }
});
/**
 * POST /ai/agents/:id/run - Run a single agent
 */
exports.agentRouter.post('/agents/:id/run', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-agent-run'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { query, conversationHistory } = req.body;
        const userId = req.user?.id;
        if (!query) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
            return;
        }
        const orchestrator = (0, agent_orchestrator_js_1.createOrchestrator)(userId);
        const result = await orchestrator.runAgent(req.params.id, query, {
            userId,
            conversationHistory
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to run agent');
        res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to run agent' } });
    }
});
// ============================================================
// Workflow Routes
// ============================================================
/**
 * POST /ai/workflows/career-analysis - Run career analysis workflow
 */
exports.agentRouter.post('/workflows/career-analysis', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-workflow-career'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { query } = req.body;
        const userId = req.user?.id;
        if (!query) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
            return;
        }
        const orchestrator = (0, agent_orchestrator_js_1.createOrchestrator)(userId);
        const results = await orchestrator.runCareerAnalysisWorkflow(userId, query);
        // Convert Map to object for JSON response
        const response = {};
        results.forEach((result, key) => {
            response[key] = result;
        });
        res.json({ success: true, data: { workflow: 'career-analysis', results: response } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to run career analysis workflow');
        res.status(500).json({ error: { code: 'WORKFLOW_ERROR', message: 'Failed to run workflow' } });
    }
});
/**
 * POST /ai/workflows/verify-proof - Run proof verification workflow
 */
exports.agentRouter.post('/workflows/verify-proof', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-workflow-verify'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { proofUrl, sourceType } = req.body;
        const userId = req.user?.id;
        if (!proofUrl || !sourceType) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'proofUrl and sourceType are required' } });
            return;
        }
        const orchestrator = (0, agent_orchestrator_js_1.createOrchestrator)(userId);
        const results = await orchestrator.runProofVerificationWorkflow(userId, proofUrl, sourceType);
        const response = {};
        results.forEach((result, key) => {
            response[key] = result;
        });
        res.json({ success: true, data: { workflow: 'verify-proof', results: response } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to run proof verification workflow');
        res.status(500).json({ error: { code: 'WORKFLOW_ERROR', message: 'Failed to run workflow' } });
    }
});
// ============================================================
// Tools Routes
// ============================================================
/**
 * GET /ai/tools - List all available tools
 */
exports.agentRouter.get('/tools', async (_req, res) => {
    try {
        const tools = (0, tool_registry_js_1.getAllTools)().map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            parameters: tool.parameters
        }));
        res.json({ success: true, data: { tools, count: tools.length } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to list tools');
        res.status(500).json({ error: { code: 'TOOL_ERROR', message: 'Failed to list tools' } });
    }
});
/**
 * GET /ai/tools/:category - Get tools by category
 */
exports.agentRouter.get('/tools/:category', async (req, res) => {
    try {
        const tools = (0, tool_registry_js_1.getToolsByCategory)(req.params.category).map(tool => ({
            name: tool.name,
            description: tool.description,
            category: tool.category,
            parameters: tool.parameters
        }));
        res.json({ success: true, data: { tools } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to get tools by category');
        res.status(500).json({ error: { code: 'TOOL_ERROR', message: 'Failed to get tools' } });
    }
});
// ============================================================
// Memory Routes
// ============================================================
/**
 * POST /ai/memory/save - Save to memory
 */
exports.agentRouter.post('/memory/save', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const { type, content, metadata } = req.body;
        const memoryManager = (0, memory_manager_js_1.createMemoryManager)(userId);
        switch (type) {
            case 'preference':
                await memoryManager.savePreferences(content);
                break;
            case 'skill':
                await memoryManager.saveSkill(content.skill, content.level, content.source);
                break;
            case 'goal':
                await memoryManager.saveGoal(content.goal, content.deadline, content.status);
                break;
            case 'fact':
                await memoryManager.saveFact(content.fact, content.importance, metadata);
                break;
            default:
                res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid memory type' } });
                return;
        }
        res.json({ success: true, data: { saved: true } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to save to memory');
        res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to save to memory' } });
    }
});
/**
 * GET /ai/memory/search - Search memories
 */
exports.agentRouter.get('/memory/search', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const { query, limit } = req.query;
        const memoryManager = (0, memory_manager_js_1.createMemoryManager)(userId);
        const memories = await memoryManager.searchMemories(query, parseInt(limit) || 10);
        res.json({ success: true, data: { memories } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to search memories');
        res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to search memories' } });
    }
});
/**
 * GET /ai/memory/preferences - Get user preferences
 */
exports.agentRouter.get('/memory/preferences', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const memoryManager = (0, memory_manager_js_1.createMemoryManager)(userId);
        const preferences = await memoryManager.getPreferences();
        res.json({ success: true, data: { preferences } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to get preferences');
        res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to get preferences' } });
    }
});
/**
 * GET /ai/memory/skills - Get user skills from memory
 */
exports.agentRouter.get('/memory/skills', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const memoryManager = (0, memory_manager_js_1.createMemoryManager)(userId);
        const skills = await memoryManager.getSkills();
        res.json({ success: true, data: { skills } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to get skills');
        res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to get skills' } });
    }
});
/**
 * GET /ai/memory/goals - Get user goals
 */
exports.agentRouter.get('/memory/goals', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            return;
        }
        const { status } = req.query;
        const memoryManager = (0, memory_manager_js_1.createMemoryManager)(userId);
        const goals = await memoryManager.getGoals(status);
        res.json({ success: true, data: { goals } });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Failed to get goals');
        res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to get goals' } });
    }
});
//# sourceMappingURL=agents.js.map