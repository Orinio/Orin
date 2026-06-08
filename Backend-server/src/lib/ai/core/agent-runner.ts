import type { AgentDefinition, AgentContext, AgentResult } from './types.js';
import { chatCompletion, chatCompletionStream, isNvidiaConfigured } from './nvidia.js';
import type { ChatMessage } from './nvidia.js';
import { getToolsByNames, toolsToOpenAITools } from './tool-registry.js';
import { logAIOperation } from '../metrics.js';
import { getRequestId, getUserId } from '../../request-context.js';
import { sanitizeAnswer } from './utils.js';

const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1000;
const DEFAULT_TOOL_TIMEOUT_MS = 30000;

function buildContextualQuery(query: string, context: AgentContext): string {
  const profileInfo = context.userProfile
    ? `\nUser: ${context.userProfile.full_name || context.userProfile.username} | College: ${context.userProfile.college || 'N/A'} | Year: ${context.userProfile.year || 'N/A'}`
    : '';

  const proofInfo = context.proofs?.length
    ? `\nPortfolio: ${context.proofs.length} proofs, ${context.proofs.filter((p: any) => p.verification_status === 'verified').length} verified`
    : '';

  return `${profileInfo}${proofInfo}\n\nQuery: ${query}`;
}

export async function runAgent(
  agent: AgentDefinition,
  query: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();

  if (!isNvidiaConfigured()) {
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

  const tools = getToolsByNames(agent.tools);
  const openAITools = tools.length > 0 ? toolsToOpenAITools(agent.tools) : undefined;

  const truncatedQuery = query.length > MAX_INPUT_LENGTH
    ? query.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
    : query;

  const messages: ChatMessage[] = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: buildContextualQuery(truncatedQuery, context) },
  ];

  const toolCalls: AgentResult['toolCalls'] = [];
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

    const response = await chatCompletion({
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

    if (!message) break;

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

        let args: Record<string, any>;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        const toolTimeout = (tool as any).timeoutMs || DEFAULT_TOOL_TIMEOUT_MS;
        let result;
        try {
          result = await Promise.race([
            tool.execute(args),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Tool ${toolName} timed out after ${toolTimeout}ms`)), toolTimeout)
            )
          ]);
        } catch (err) {
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
      finalAnswer = sanitizeAnswer(message.content);
      break;
    }

    break;
  }

  const durationMs = Date.now() - startTime;

  logAIOperation({
    operation: agent.id,
    model: agent.model,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    tokensTotal: totalTokens,
    durationMs,
    iterations,
    toolCallsCount: toolCalls.length,
    success: !!finalAnswer,
    requestId: getRequestId(),
    userId: getUserId(),
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

export async function runAgentStream(
  agent: AgentDefinition,
  query: string,
  context: AgentContext,
  onChunk: (chunk: string) => void
): Promise<void> {
  if (!isNvidiaConfigured()) {
    onChunk('AI service is not configured. Please try again later.');
    return;
  }

  const truncatedQuery = query.length > MAX_INPUT_LENGTH
    ? query.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
    : query;

  const messages = [
    { role: 'system' as const, content: agent.systemPrompt },
    ...(context.conversationHistory?.slice(-6) || []),
    { role: 'user' as const, content: buildContextualQuery(truncatedQuery, context) },
  ];

  const stream = chatCompletionStream({
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
