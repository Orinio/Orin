/**
 * Orin AI - Agent Orchestrator
 * Manages multiple AI agents working together with memory, native tool calling, and streaming
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../logger.js';
import { chatCompletion, isNvidiaConfigured } from '../core/nvidia.js';
import type { ChatMessage, ToolCallResponse } from '../core/nvidia.js';
import { createMemoryManager, type MemoryManager } from '../memory/memory-manager.js';
import { getToolsByNames, toolsToOpenAITools } from '../core/tool-registry.js';
import { buildAgentContext as buildUserContext } from '../../context.js';
import { getAllAgents, getAgent } from '../agents/index.js';
import { sanitizeAnswer } from '../core/utils.js';
import { logAIOperation } from '../metrics.js';
import { getRequestId } from '../../request-context.js';
import type { ToolResult, AgentDefinition } from '../core/types.js';

const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1500;
const DEFAULT_TOOL_TIMEOUT_MS = 20000;

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
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCallResponse[];
  tool_call_id?: string;
  name?: string;
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
      const parsed = (() => {
        try { return JSON.parse(content); } catch { return null; }
      })();

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
    context?: { userId?: string; authUserId?: string; conversationHistory?: AgentMessage[] }
  ): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    const startTime = Date.now();
    const tools = getToolsByNames(agent.tools);

    // Build messages
    const messages: ChatMessage[] = [
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
        const userProfile = await buildUserContext(context.authUserId || context.userId!);
        if (userProfile) {
          messages[0].content += `\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2).substring(0, 2000)}`;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to load user profile for runAgent');
      }
    }

    // Add conversation history (last 6 messages for context window)
    if (context?.conversationHistory?.length) {
      messages.push(...context.conversationHistory.slice(-6));
    }

    // Add user query
    messages.push({ role: 'user', content: query });

    // Convert tools to OpenAI format for native tool calling
    const openAITools = tools.length > 0 ? toolsToOpenAITools(agent.tools) : undefined;

    // Execute with native tool calling loop
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
        max_tokens: agent.maxTokens,
        ...(openAITools ? { tools: openAITools, tool_choice: 'auto' } : {}),
      });

      const choice = response.choices[0];
      const message = choice?.message;
      totalTokens += response.usage?.total_tokens || 0;

      if (!message) break;

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
          let args: Record<string, any>;
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
            logger.warn({ toolName, rawArgs: toolCall.function.arguments }, 'Failed to parse tool arguments');
          }

          // Execute the tool with budget-aware timeout
          // Budget = min(tool timeout, remaining agent time - 15s buffer for next model call)
          const elapsed = Date.now() - startTime;
          const remainingBudget = agent.timeoutMs - elapsed - 15000; // 15s buffer for model response
          const toolTimeout = Math.min(
            (tool as any).timeoutMs || DEFAULT_TOOL_TIMEOUT_MS,
            Math.max(remainingBudget, 5000) // At least 5s per tool
          );
          let result: ToolResult;
          try {
            result = await Promise.race([
              tool.execute(args, { userId: context?.userId }),
              new Promise<ToolResult>((_, reject) =>
                setTimeout(() => reject(new Error(`Tool ${toolName} timed out after ${toolTimeout}ms`)), toolTimeout)
              )
            ]);
          } catch (err) {
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
        finalAnswer = sanitizeAnswer(message.content);
        break;
      }

      // Case 3: Empty response — break to avoid infinite loop
      break;
    }

    const durationMs = Date.now() - startTime;

    // Structured AI operation log
    logAIOperation({
      operation: agentId,
      model: agent.model,
      tokensIn: 0,
      tokensOut: 0,
      tokensTotal: totalTokens,
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

    // Extract visual specs from tool calls that produce them
    const visualSpecs = toolCalls
      .filter(tc => tc.result.success && tc.result.data?.visualSpec)
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
  async runAgentStream(
    agentId: string,
    query: string,
    context: { userId?: string; authUserId?: string; conversationHistory?: AgentMessage[]; modelOverride?: string },
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
    if (context.authUserId || context.userId) {
      try {
        const userProfile = await buildUserContext(context.authUserId || context.userId!);
        if (userProfile) {
          systemPrompt += `\n\nFull User Profile from Database:\n${JSON.stringify(userProfile, null, 2).substring(0, 2000)}`;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to load user profile');
      }
    }

    // Truncate query if too long
    const truncatedQuery = query.length > MAX_INPUT_LENGTH
      ? query.substring(0, MAX_INPUT_LENGTH) + '... (truncated)'
      : query;

    // Build messages array
    const messages: ChatMessage[] = [
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
    const openAITools = tools.length > 0 ? toolsToOpenAITools(agent.tools) : undefined;

    // Native tool calling loop
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
        const response = await chatCompletion({
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
            let args: Record<string, any>;
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch {
              args = {};
              logger.warn({ toolName, rawArgs: toolCall.function.arguments }, 'Failed to parse tool arguments');
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
            const toolTimeout = Math.min(
              (tool as any).timeoutMs || DEFAULT_TOOL_TIMEOUT_MS,
              Math.max(remainingBudget, 5000) // At least 5s per tool
            );

            let result: ToolResult;
            try {
              result = await Promise.race([
                tool.execute(args, { userId: context.userId }),
                new Promise<ToolResult>((_, reject) =>
                  setTimeout(() => reject(new Error(`Tool ${tool.name} timed out after ${toolTimeout}ms`)), toolTimeout)
                )
              ]);
            } catch (err) {
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

            // Emit visual_spec event when tools produce a spec
            if (result.success && result.data?.visualSpec) {
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
          finalAnswer = sanitizeAnswer(message.content);
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
      tokensTotal: totalTokens,
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
      durationMs,
      followUps: extractFollowUps(finalAnswer),
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
// Follow-up extraction from answer text
// ============================================================
function extractFollowUps(answer: string): string[] {
  const followUps: string[] = [];

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
export function createOrchestrator(userId?: string): AgentOrchestrator {
  return new AgentOrchestrator(userId);
}

export default {
  AgentOrchestrator,
  createOrchestrator,
  AGENTS
};
