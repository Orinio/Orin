import type { AgentDefinition, AgentContext, AgentResult, AgentResponse } from './types.js';
import { chatCompletion, chatCompletionStream, isNvidiaConfigured } from './nvidia.js';
import { getToolsByNames } from './tool-registry.js';
import { logger } from '../../logger.js';

const MAX_INPUT_LENGTH = 2000;

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
  const toolDescriptions = tools.map(t =>
    `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`
  ).join('\n');

  const systemPrompt = tools.length > 0
    ? `${agent.systemPrompt}\n\nAvailable tools:\n${toolDescriptions}`
    : agent.systemPrompt;

  const truncatedQuery = query.length > MAX_INPUT_LENGTH
    ? query.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
    : query;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildContextualQuery(truncatedQuery, context) },
  ];

  const toolCalls: AgentResult['toolCalls'] = [];
  let iterations = 0;
  let totalTokens = 0;
  let finalAnswer = '';
  let thinking = '';

  while (iterations < agent.maxIterations) {
    iterations++;

    const response = await chatCompletion({
      model: agent.model,
      messages,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    totalTokens += response.usage?.total_tokens || 0;

    let parsed: AgentResponse;
    try {
      const cleaned = content.replace(/[\r\n\t]/g, ' ').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      finalAnswer = content;
      thinking = 'Response was not valid JSON, using raw content';
      break;
    }

    thinking = parsed.thinking || thinking;

    if (parsed.answer) {
      finalAnswer = parsed.answer;
      break;
    }

    if (parsed.tool_call) {
      const tool = tools.find(t => t.name === parsed.tool_call!.name);
      if (!tool) {
        toolCalls.push({
          tool: parsed.tool_call.name,
          args: parsed.tool_call.arguments,
          result: { success: false, error: `Tool '${parsed.tool_call.name}' not found` },
        });
        messages.push({
          role: 'user',
          content: `Tool '${parsed.tool_call.name}' does not exist. Available: ${tools.map(t => t.name).join(', ')}`,
        });
        continue;
      }

      const result = await tool.execute(parsed.tool_call.arguments);
      toolCalls.push({ tool: parsed.tool_call.name, args: parsed.tool_call.arguments, result });

      messages.push({ role: 'assistant', content: JSON.stringify({ tool_call: parsed.tool_call }) });
      messages.push({
        role: 'user',
        content: `Tool result for ${parsed.tool_call.name}: ${JSON.stringify(result).substring(0, 1000)}`,
      });
    }
  }

  const durationMs = Date.now() - startTime;

  logger.info({
    agentId: agent.id,
    model: agent.model,
    iterations,
    totalTokens,
    toolCallsCount: toolCalls.length,
    durationMs,
  }, 'Agent run completed');

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

  const tools = getToolsByNames(agent.tools);
  const toolDescriptions = tools.map(t =>
    `- ${t.name}(${Object.entries(t.parameters.properties).map(([k, v]) => `${k}: ${v.type}`).join(', ')}): ${t.description}`
  ).join('\n');

  const systemPrompt = tools.length > 0
    ? `${agent.systemPrompt}\n\nAvailable tools:\n${toolDescriptions}`
    : agent.systemPrompt;

  const truncatedQuery = query.length > MAX_INPUT_LENGTH
    ? query.slice(0, MAX_INPUT_LENGTH) + '... (truncated)'
    : query;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
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
