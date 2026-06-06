import type { AgentDefinition, AgentContext, AgentResult, AgentResponse } from './types.js';
import { chatCompletion, chatCompletionStream, isNvidiaConfigured } from './nvidia.js';
import { getToolsByNames } from './tool-registry.js';
import { logAIOperation } from '../metrics.js';
import { getRequestId, getUserId } from '../../request-context.js';

const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1000;

// ---- Safety: patterns that should never appear in AI responses ----
const BLOCKED_PATTERNS = [
  /api[_-]?key[:\s]*[A-Za-z0-9_-]{20,}/i,
  /secret[:\s]*[A-Za-z0-9_-]{20,}/i,
  /password[:\s]+\S+/i,
  /Bearer\s+[A-Za-z0-9._-]{20,}/i,
];

function sanitizeAnswer(answer: string): string {
  let sanitized = answer;
  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

function buildContextualQuery(query: string, context: AgentContext): string {
  const profileInfo = context.userProfile
    ? `\nUser: ${context.userProfile.full_name || context.userProfile.username} | College: ${context.userProfile.college || 'N/A'} | Year: ${context.userProfile.year || 'N/A'}`
    : '';

  const proofInfo = context.proofs?.length
    ? `\nPortfolio: ${context.proofs.length} proofs, ${context.proofs.filter((p: any) => p.verification_status === 'verified').length} verified`
    : '';

  return `${profileInfo}${proofInfo}\n\nQuery: ${query}`;
}

/**
 * Robust JSON extraction from LLM output.
 * Tries multiple strategies to parse structured responses.
 */
function extractJSON(content: string): AgentResponse | null {
  // Strategy 1: Direct parse (LLM returns clean JSON)
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* continue */ }

  // Strategy 2: Find JSON block in markdown or text
  const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') return parsed;
    } catch { /* continue */ }
  }

  // Strategy 3: Find first complete JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch { /* continue */ }
  }

  return null;
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
  const agentStartTime = Date.now();

  while (iterations < agent.maxIterations) {
    iterations++;

    // Check agent-level timeout
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
    });

    const content = response.choices[0]?.message?.content || '';
    totalTokens += response.usage?.total_tokens || 0;

    // Try robust JSON extraction
    const parsed = extractJSON(content);

    if (!parsed) {
      finalAnswer = sanitizeAnswer(content);
      thinking = 'Response was not valid JSON, using raw content';
      break;
    }

    thinking = parsed.thinking || thinking;

    if (parsed.answer) {
      finalAnswer = sanitizeAnswer(parsed.answer);
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

      // Safety: validate tool arguments are not empty/malicious
      const args = parsed.tool_call.arguments || {};
      if (typeof args !== 'object') {
        toolCalls.push({
          tool: parsed.tool_call.name,
          args,
          result: { success: false, error: 'Invalid tool arguments' },
        });
        messages.push({
          role: 'user',
          content: `Tool '${parsed.tool_call.name}' received invalid arguments. Expected object.`,
        });
        continue;
      }

      const result = await tool.execute(args);
      toolCalls.push({ tool: parsed.tool_call.name, args, result });

      // Truncate large tool results to avoid context overflow
      const resultStr = JSON.stringify(result).substring(0, MAX_TOOL_RESULT_LENGTH);

      messages.push({ role: 'assistant', content: JSON.stringify({ tool_call: parsed.tool_call }) });
      messages.push({
        role: 'user',
        content: `Tool result for ${parsed.tool_call.name}: ${resultStr}`,
      });
    }
  }

  const durationMs = Date.now() - startTime;

  // Structured AI operation log
  logAIOperation({
    operation: agent.id,
    model: agent.model,
    tokensIn: 0, // Will be updated if we track prompt tokens separately
    tokensOut: 0,
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
