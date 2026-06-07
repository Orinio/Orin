/**
 * Orin AI - Agent Orchestrator
 * Manages multiple AI agents working together with memory, tool calling, and streaming
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../logger.js';
import { chatCompletion, isNvidiaConfigured } from '../core/nvidia.js';
import { createMemoryManager, type MemoryManager } from '../memory/memory-manager.js';
import { getToolsByNames } from '../core/tool-registry.js';
import { buildAgentContext as buildUserContext } from '../../context.js';
import { getAllAgents, getAgent } from '../agents/index.js';
import { sanitizeAnswer, extractJSON } from '../core/utils.js';
import { logAIOperation } from '../metrics.js';
import { getRequestId } from '../../request-context.js';
import type { ToolResult, AgentDefinition } from '../core/types.js';

const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1000;
const DEFAULT_TOOL_TIMEOUT_MS = 30000;

// ============================================================
// Intent → Agent routing map
// ============================================================
const INTENT_AGENT_MAP: Record<string, string> = {
  coaching: 'coach',
  skills: 'skill-analysis',
  opportunities: 'opportunity-matcher',
  learning: 'learning-path',
  portfolio: 'portfolio-scorer',
  verification: 'verification',
  general: 'chat',
};

// ============================================================
// Types
// ============================================================
export type Agent = AgentDefinition;

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: AgentResult;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentResult {
  agentId: string;
  answer: string;
  thinking: string;
  toolCalls: Array<{ tool: string; args: any; result: ToolResult }>;
  iterations: number;
  tokensUsed: number;
  durationMs: number;
}

export interface WorkflowStep {
  agentId: string;
  query: string;
  dependsOn?: string[];
  transform?: (previousResult: AgentResult) => string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

// ============================================================
// Pre-defined Agents — single source of truth from agents/*.agent.ts
// ============================================================
const agentList = getAllAgents();
export const AGENTS: Record<string, Agent> = Object.fromEntries(
  agentList.map(a => [a.id, a])
) as Record<string, Agent>;

// ============================================================
// Agent Orchestrator Class
// ============================================================
export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private memoryManager: MemoryManager | null = null;
  private sessionId: string;

  constructor(userId?: string) {
    this.sessionId = uuidv4();
    
    // Register all agents
    for (const agent of Object.values(AGENTS)) {
      this.agents.set(agent.id, agent);
    }

    // Initialize memory manager if userId provided
    if (userId) {
      this.memoryManager = createMemoryManager(userId);
    }
  }

  // ------------------------------------------------------------
  // Intent Routing
  // ------------------------------------------------------------

  /**
   * Classify user intent using the router agent (cheap nano model).
   * Returns the agent ID to route to.
   */
  async routeQuery(query: string): Promise<{ agentId: string; category: string; confidence: number }> {
    const routerAgentDef = getAgent('router');
    if (!routerAgentDef || !isNvidiaConfigured()) {
      return { agentId: 'chat', category: 'general', confidence: 0.5 };
    }

    try {
      const response = await chatCompletion({
        model: routerAgentDef.model,
        messages: [
          { role: 'system', content: routerAgentDef.systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content || '';
      const parsed = extractJSON<{ category: string; confidence: number }>(content);

      if (parsed?.category && INTENT_AGENT_MAP[parsed.category]) {
        const agentId = INTENT_AGENT_MAP[parsed.category];
        logger.info({ query: query.substring(0, 50), category: parsed.category, agentId, confidence: parsed.confidence }, 'Intent routed');
        return {
          agentId,
          category: parsed.category,
          confidence: parsed.confidence || 0.8
        };
      }
    } catch (error) {
      logger.warn({ error }, 'Intent classification failed, falling back to chat');
    }

    return { agentId: 'chat', category: 'general', confidence: 0.5 };
  }

  // ------------------------------------------------------------
  // Single Agent Execution
  // ------------------------------------------------------------

  async runAgent(
    agentId: string,
    query: string,
    context?: { userId?: string; conversationHistory?: AgentMessage[] }
  ): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    const startTime = Date.now();
    const tools = getToolsByNames(agent.tools);

    // Build messages
    const messages: AgentMessage[] = [
      { role: 'system', content: agent.systemPrompt }
    ];

    // Add context from memory if available
    if (this.memoryManager) {
      const memoryContext = await this.memoryManager.buildAgentContext();
      messages[0].content += `\n\n${memoryContext}`;
    }

    // Add user profile context
    if (context?.userId) {
      try {
        const userProfile = await buildUserContext(context.userId);
        if (userProfile) {
          messages[0].content += `\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2).substring(0, 2000)}`;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to load user profile for runAgent');
      }
    }

    // Add tool descriptions
    if (tools.length > 0) {
      const toolDescriptions = tools.map(t =>
        `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`
      ).join('\n');
      messages[0].content += `\n\nAvailable tools:\n${toolDescriptions}`;
    }

    // Add conversation history (last 6 messages for context window)
    if (context?.conversationHistory?.length) {
      messages.push(...context.conversationHistory.slice(-6));
    }

    // Add user query
    messages.push({ role: 'user', content: query });

    // Execute with tool calling loop
    let iterations = 0;
    let totalTokens = 0;
    let finalAnswer = '';
    let thinking = '';
    const toolCalls: AgentResult['toolCalls'] = [];

    while (iterations < agent.maxIterations) {
      iterations++;

      const response = await chatCompletion({
        model: agent.model,
        messages,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens
      });

      const content = response.choices[0]?.message?.content || '';
      totalTokens += response.usage?.total_tokens || 0;

      // Parse response
      const parsed = extractJSON(content);

      if (!parsed) {
        finalAnswer = sanitizeAnswer(content);
        break;
      }

      thinking = parsed.thinking || thinking;

      if (parsed.answer) {
        finalAnswer = sanitizeAnswer(parsed.answer);
        break;
      }

      if (parsed.tool_call) {
        const tool = tools.find(t => t.name === parsed.tool_call.name);
        if (tool) {
          const toolTimeout = (tool as any).timeoutMs || DEFAULT_TOOL_TIMEOUT_MS;
          try {
            const result = await Promise.race([
              tool.execute(parsed.tool_call.arguments, { userId: context?.userId }),
              new Promise<ToolResult>((_, reject) =>
                setTimeout(() => reject(new Error(`Tool ${tool.name} timed out after ${toolTimeout}ms`)), toolTimeout)
              )
            ]);
            toolCalls.push({ tool: tool.name, args: parsed.tool_call.arguments, result });

            messages.push({ role: 'assistant', content: JSON.stringify({ tool_call: parsed.tool_call }) });
            messages.push({ role: 'user', content: `Tool result: ${JSON.stringify(result).substring(0, MAX_TOOL_RESULT_LENGTH)}` });
          } catch (err) {
            const errorResult: ToolResult = { success: false, error: err instanceof Error ? err.message : 'Tool execution failed' };
            toolCalls.push({ tool: tool.name, args: parsed.tool_call.arguments, result: errorResult });
            messages.push({ role: 'user', content: `Tool ${tool.name} failed: ${errorResult.error}` });
          }
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Structured AI operation log
    logAIOperation({
      operation: agentId,
      model: agent.model,
      tokensIn: 0,
      tokensOut: 0,
      tokensTotal,
      durationMs,
      iterations,
      toolCallsCount: toolCalls.length,
      success: !!finalAnswer,
      requestId: getRequestId(),
      userId: context?.userId,
    });

    // Save to memory if available
    if (this.memoryManager && context?.userId) {
      await this.memoryManager.saveConversation(this.sessionId, [
        { role: 'user', content: query },
        { role: 'assistant', content: finalAnswer }
      ]);
    }

    return {
      agentId,
      answer: finalAnswer,
      thinking,
      toolCalls,
      iterations,
      tokensUsed: totalTokens,
      durationMs
    };
  }

  // ------------------------------------------------------------
  // Streaming Agent Execution with Tool Calling
  // ------------------------------------------------------------

  /**
   * Run an agent with streaming that emits structured events:
   * - 'thinking': Agent's reasoning
   * - 'tool_start': Tool is about to be called
   * - 'tool_result': Tool call completed
   * - 'answer': Answer text chunk
   * - 'complete': Final result with all data
   */
  async runAgentStream(
    agentId: string,
    query: string,
    context: { userId?: string; conversationHistory?: AgentMessage[] },
    onEvent: (event: string, data: any) => void
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      onEvent('error', { message: `Agent '${agentId}' not found` });
      return;
    }

    if (!isNvidiaConfigured()) {
      onEvent('answer', { content: 'AI service is not configured. Please try again later.' });
      onEvent('complete', { answer: 'AI service is not configured.' });
      return;
    }

    const startTime = Date.now();
    const tools = getToolsByNames(agent.tools);

    // Build system prompt with memory context
    let systemPrompt = agent.systemPrompt;

    // Add memory context
    if (this.memoryManager) {
      try {
        const memoryContext = await this.memoryManager.buildAgentContext();
        if (memoryContext) {
          systemPrompt += `\n\n${memoryContext}`;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to load memory context');
      }
    }

    // Fetch full user data from Supabase for rich context
    if (context.userId) {
      try {
        const userProfile = await buildUserContext(context.userId);
        if (userProfile) {
          systemPrompt += `\n\nFull User Profile from Database:\n${JSON.stringify(userProfile, null, 2).substring(0, 2000)}`;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to load user profile');
      }
    }

    // Add tool descriptions
    if (tools.length > 0) {
      const toolDescriptions = tools.map(t =>
        `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`
      ).join('\n');
      systemPrompt += `\n\nAvailable tools:\n${toolDescriptions}`;
    }

    // Truncate query if too long
    const truncatedQuery = query.length > MAX_INPUT_LENGTH
      ? query.substring(0, MAX_INPUT_LENGTH) + '... (truncated)'
      : query;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (context.conversationHistory) {
      messages.push(...context.conversationHistory.slice(-6));
    }

    // Add user query with context
    const profileInfo = context.userId ? `\nUser ID: ${context.userId}` : '';
    messages.push({ role: 'user', content: `${profileInfo}\n\nUser Query: ${truncatedQuery}` });

    // Tool calling loop with streaming
    let iterations = 0;
    let totalTokens = 0;
    let finalAnswer = '';
    let thinking = '';
    const toolCalls: AgentResult['toolCalls'] = [];
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
        // Use non-streaming completion for tool-calling loop (more reliable for JSON parsing)
        const response = await chatCompletion({
          model: agent.model,
          messages,
          temperature: agent.temperature,
          max_tokens: agent.maxTokens,
        });

        const content = response.choices[0]?.message?.content || '';
        totalTokens += response.usage?.total_tokens || 0;

        // Robust JSON extraction
        const parsed = extractJSON(content);

        if (!parsed) {
          finalAnswer = sanitizeAnswer(content);
          thinking = 'Response was not valid JSON, using raw content';
          onEvent('thinking', { content: thinking });
          // Stream the raw answer
          const chunkSize = 20;
          for (let i = 0; i < finalAnswer.length; i += chunkSize) {
            onEvent('answer', { content: finalAnswer.substring(i, i + chunkSize) });
          }
          break;
        }

        if (parsed.thinking) {
          thinking = parsed.thinking;
          onEvent('thinking', { content: parsed.thinking, iteration: iterations });
        }

        // If we have an answer, stream it and break
        if (parsed.answer) {
          finalAnswer = sanitizeAnswer(parsed.answer);
          // Stream the answer in chunks for smooth UX
          const chunkSize = 20;
          for (let i = 0; i < finalAnswer.length; i += chunkSize) {
            onEvent('answer', { content: finalAnswer.substring(i, i + chunkSize) });
          }
          break;
        }

        // If we have a tool call, execute it
        if (parsed.tool_call) {
          const tool = tools.find(t => t.name === parsed.tool_call.name);
          if (!tool) {
            onEvent('thinking', { content: `Tool '${parsed.tool_call.name}' not found. Available: ${tools.map(t => t.name).join(', ')}` });
            messages.push({
              role: 'user',
              content: `Tool '${parsed.tool_call.name}' does not exist. Available: ${tools.map(t => t.name).join(', ')}`
            });
            continue;
          }

          // Validate tool arguments
          const args = parsed.tool_call.arguments || {};
          if (typeof args !== 'object') {
            onEvent('thinking', { content: `Tool '${tool.name}' received invalid arguments` });
            messages.push({
              role: 'user',
              content: `Tool '${tool.name}' received invalid arguments. Expected object.`
            });
            continue;
          }

          onEvent('tool_start', {
            tool: tool.name,
            description: tool.description,
            args: parsed.tool_call.arguments,
            step: toolCalls.length + 1,
            totalSteps: agent.maxIterations,
          });

          const toolStartTime = Date.now();
          const toolTimeout = (tool as any).timeoutMs || DEFAULT_TOOL_TIMEOUT_MS;

          let result: ToolResult;
          try {
            result = await Promise.race([
              tool.execute(parsed.tool_call.arguments, { userId: context.userId }),
              new Promise<ToolResult>((_, reject) =>
                setTimeout(() => reject(new Error(`Tool ${tool.name} timed out after ${toolTimeout}ms`)), toolTimeout)
              )
            ]);
          } catch (err) {
            result = { success: false, error: err instanceof Error ? err.message : 'Tool execution failed' };
          }

          const toolDurationMs = Date.now() - toolStartTime;
          toolCalls.push({ tool: tool.name, args: parsed.tool_call.arguments, result });

          onEvent('tool_result', {
            tool: tool.name,
            success: result.success,
            data: result.data,
            error: result.error,
            durationMs: toolDurationMs,
            step: toolCalls.length,
          });

          // Add tool call and result to messages for next iteration (truncated)
          messages.push({ role: 'assistant', content: JSON.stringify({ tool_call: parsed.tool_call }) });
          const resultStr = JSON.stringify(result).substring(0, MAX_TOOL_RESULT_LENGTH);
          messages.push({
            role: 'user',
            content: `Tool result for ${parsed.tool_call.name}: ${resultStr}`
          });
        }
      } catch (err) {
        logger.error({ err, agentId, iterations }, 'Agent streaming error');
        onEvent('thinking', { content: `Error in iteration ${iterations}: ${err instanceof Error ? err.message : 'Unknown error'}` });
        break;
      }
    }

    const durationMs = Date.now() - startTime;

    // Structured AI operation log
    logAIOperation({
      operation: `${agentId}-stream`,
      model: agent.model,
      tokensIn: 0,
      tokensOut: 0,
      tokensTotal,
      durationMs,
      iterations,
      toolCallsCount: toolCalls.length,
      success: !!finalAnswer,
      requestId: getRequestId(),
      userId: context?.userId,
    });

    // Save conversation to memory
    if (this.memoryManager && context.userId) {
      try {
        await this.memoryManager.saveConversation(this.sessionId, [
          { role: 'user', content: query },
          { role: 'assistant', content: finalAnswer }
        ]);
      } catch (err) {
        logger.warn({ err }, 'Failed to save conversation to memory');
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
      durationMs
    });
  }

  // ------------------------------------------------------------
  // Multi-Agent Workflow Execution
  // ------------------------------------------------------------

  async runWorkflow(
    workflow: Workflow,
    _initialQuery: string,
    context?: { userId?: string }
  ): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();
    const completedSteps = new Set<string>();

    for (const step of workflow.steps) {
      // Check dependencies
      if (step.dependsOn?.some(dep => !completedSteps.has(dep))) {
        logger.warn({ step: step.agentId }, 'Skipping step due to unmet dependencies');
        continue;
      }

      // Build query from previous results if needed
      let query = step.query;
      if (step.transform && step.dependsOn) {
        const previousResults = step.dependsOn
          .map(dep => results.get(dep))
          .filter(Boolean);
        
        if (previousResults.length > 0) {
          query = step.transform(previousResults[0]!);
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

  async runCareerAnalysisWorkflow(userId: string, query: string): Promise<Map<string, AgentResult>> {
    const workflow: Workflow = {
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

  async runProofVerificationWorkflow(userId: string, proofUrl: string, sourceType: string): Promise<Map<string, AgentResult>> {
    const workflow: Workflow = {
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

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// ============================================================
// Factory function
// ============================================================
export function createOrchestrator(userId?: string): AgentOrchestrator {
  return new AgentOrchestrator(userId);
}

export default {
  AgentOrchestrator,
  createOrchestrator,
  AGENTS
};
