/**
 * Orin AI - Comprehensive Agent Routes
 * Exposes all AI agent capabilities to the frontend
 */

import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { isNvidiaConfigured } from '../lib/ai/core/nvidia.js';
import { createOrchestrator, AGENTS } from '../lib/ai/orchestrator/agent-orchestrator.js';
import { createMemoryManager } from '../lib/ai/memory/memory-manager.js';
import { getAllTools, getToolsByCategory } from '../lib/ai/core/tool-registry.js';
export const agentRouter = Router();

// ============================================================
// Agent Management Routes
// ============================================================

/**
 * GET /ai/agents - List all available agents
 */
agentRouter.get('/agents', async (_req, res) => {
  try {
    const agents = Object.values(AGENTS).map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      tools: agent.tools,
      description: agent.systemPrompt.split('\n')[0]
    }));

    res.json({ success: true, data: { agents } });
  } catch (error) {
    logger.error({ error }, 'Failed to list agents');
    res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to list agents' } });
  }
});

/**
 * GET /ai/agents/:id - Get agent details
 */
agentRouter.get('/agents/:id', async (req, res) => {
  try {
    const agent = AGENTS[req.params.id as string];
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
  } catch (error) {
    logger.error({ error }, 'Failed to get agent');
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
agentRouter.post('/agents/chat', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { query, conversationHistory } = req.body;
    const userId = (req as any).user?.id;

    if (!query) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
      return;
    }

    const orchestrator = createOrchestrator(userId);
    const result = await orchestrator.runAgent('chat', query, {
      userId,
      conversationHistory
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Failed to run chat agent');
    res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to run chat' } });
  }
});

/**
 * POST /ai/agents/chat/stream - Stream chat responses
 * (Must be before /agents/:id to avoid matching "chat" as :id)
 */
agentRouter.post('/agents/chat/stream', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { query } = req.body;
    const userId = (req as any).user?.id;

    if (!query) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
      return;
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial event
    sendEvent('start', { agentId: 'chat', query });

    try {
      const orchestrator = createOrchestrator(userId);
      const result = await orchestrator.runAgent('chat', query, { userId });

      // Send result
      sendEvent('complete', result);
    } catch (error) {
      sendEvent('error', { message: 'Failed to process request' });
    }

    res.write('event: end\ndata: {}\n\n');
    res.end();
  } catch (error) {
    logger.error({ error }, 'Failed to stream chat');
    res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to stream chat' } });
  }
});

/**
 * POST /ai/agents/:id/run - Run a single agent
 */
agentRouter.post('/agents/:id/run', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { query, conversationHistory } = req.body;
    const userId = (req as any).user?.id;

    if (!query) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
      return;
    }

    const orchestrator = createOrchestrator(userId);
    const result = await orchestrator.runAgent(req.params.id as string, query, {
      userId,
      conversationHistory
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Failed to run agent');
    res.status(500).json({ error: { code: 'AGENT_ERROR', message: 'Failed to run agent' } });
  }
});

// ============================================================
// Workflow Routes
// ============================================================

/**
 * POST /ai/workflows/career-analysis - Run career analysis workflow
 */
agentRouter.post('/workflows/career-analysis', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { query } = req.body;
    const userId = (req as any).user?.id;

    if (!query) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Query is required' } });
      return;
    }

    const orchestrator = createOrchestrator(userId);
    const results = await orchestrator.runCareerAnalysisWorkflow(userId, query);

    // Convert Map to object for JSON response
    const response: Record<string, any> = {};
    results.forEach((result, key) => {
      response[key] = result;
    });

    res.json({ success: true, data: { workflow: 'career-analysis', results: response } });
  } catch (error) {
    logger.error({ error }, 'Failed to run career analysis workflow');
    res.status(500).json({ error: { code: 'WORKFLOW_ERROR', message: 'Failed to run workflow' } });
  }
});

/**
 * POST /ai/workflows/verify-proof - Run proof verification workflow
 */
agentRouter.post('/workflows/verify-proof', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { proofUrl, sourceType } = req.body;
    const userId = (req as any).user?.id;

    if (!proofUrl || !sourceType) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'proofUrl and sourceType are required' } });
      return;
    }

    const orchestrator = createOrchestrator(userId);
    const results = await orchestrator.runProofVerificationWorkflow(userId, proofUrl, sourceType);

    const response: Record<string, any> = {};
    results.forEach((result, key) => {
      response[key] = result;
    });

    res.json({ success: true, data: { workflow: 'verify-proof', results: response } });
  } catch (error) {
    logger.error({ error }, 'Failed to run proof verification workflow');
    res.status(500).json({ error: { code: 'WORKFLOW_ERROR', message: 'Failed to run workflow' } });
  }
});

// ============================================================
// Tools Routes
// ============================================================

/**
 * GET /ai/tools - List all available tools
 */
agentRouter.get('/tools', async (_req, res) => {
  try {
    const tools = getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters
    }));

    res.json({ success: true, data: { tools, count: tools.length } });
  } catch (error) {
    logger.error({ error }, 'Failed to list tools');
    res.status(500).json({ error: { code: 'TOOL_ERROR', message: 'Failed to list tools' } });
  }
});

/**
 * GET /ai/tools/:category - Get tools by category
 */
agentRouter.get('/tools/:category', async (req, res) => {
  try {
    const tools = getToolsByCategory(req.params.category as any).map(tool => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters
    }));

    res.json({ success: true, data: { tools } });
  } catch (error) {
    logger.error({ error }, 'Failed to get tools by category');
    res.status(500).json({ error: { code: 'TOOL_ERROR', message: 'Failed to get tools' } });
  }
});

// ============================================================
// Memory Routes
// ============================================================

/**
 * POST /ai/memory/save - Save to memory
 */
agentRouter.post('/memory/save', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const { type, content, metadata } = req.body;
    const memoryManager = createMemoryManager(userId);

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
  } catch (error) {
    logger.error({ error }, 'Failed to save to memory');
    res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to save to memory' } });
  }
});

/**
 * GET /ai/memory/search - Search memories
 */
agentRouter.get('/memory/search', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const { query, limit } = req.query;
    const memoryManager = createMemoryManager(userId);
    const memories = await memoryManager.searchMemories(query as string, parseInt(limit as string) || 10);

    res.json({ success: true, data: { memories } });
  } catch (error) {
    logger.error({ error }, 'Failed to search memories');
    res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to search memories' } });
  }
});

/**
 * GET /ai/memory/preferences - Get user preferences
 */
agentRouter.get('/memory/preferences', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const memoryManager = createMemoryManager(userId);
    const preferences = await memoryManager.getPreferences();

    res.json({ success: true, data: { preferences } });
  } catch (error) {
    logger.error({ error }, 'Failed to get preferences');
    res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to get preferences' } });
  }
});

/**
 * GET /ai/memory/skills - Get user skills from memory
 */
agentRouter.get('/memory/skills', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const memoryManager = createMemoryManager(userId);
    const skills = await memoryManager.getSkills();

    res.json({ success: true, data: { skills } });
  } catch (error) {
    logger.error({ error }, 'Failed to get skills');
    res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to get skills' } });
  }
});

/**
 * GET /ai/memory/goals - Get user goals
 */
agentRouter.get('/memory/goals', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const { status } = req.query;
    const memoryManager = createMemoryManager(userId);
    const goals = await memoryManager.getGoals(status as string);

    res.json({ success: true, data: { goals } });
  } catch (error) {
    logger.error({ error }, 'Failed to get goals');
    res.status(500).json({ error: { code: 'MEMORY_ERROR', message: 'Failed to get goals' } });
  }
});
