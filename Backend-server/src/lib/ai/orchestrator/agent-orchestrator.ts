/**
 * Orin AI - Agent Orchestrator
 * Manages multiple AI agents working together with memory, tool calling, and streaming
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../logger.js';
import { MODELS } from '../core/models.js';
import { chatCompletion, chatCompletionStream, isNvidiaConfigured } from '../core/nvidia.js';
import { createMemoryManager, type MemoryManager } from '../memory/memory-manager.js';
import { getToolsByNames } from '../core/tool-registry.js';
import { buildAgentContext as buildUserContext } from '../../context.js';
import type { ToolResult } from '../core/types.js';

// Robust JSON extraction from LLM output
function extractJSON(content: string): any | null {
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* continue */ }

  // Strategy 2: Find JSON block in markdown
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

// Sanitize answer to remove sensitive patterns
function sanitizeAnswer(answer: string): string {
  const BLOCKED_PATTERNS = [
    /api[_-]?key[:\s]*[A-Za-z0-9_-]{20,}/i,
    /secret[:\s]*[A-Za-z0-9_-]{20,}/i,
    /password[:\s]+\S+/i,
    /Bearer\s+[A-Za-z0-9._-]{20,}/i,
  ];
  let sanitized = answer;
  for (const pattern of BLOCKED_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

const MAX_INPUT_LENGTH = 2000;
const MAX_TOOL_RESULT_LENGTH = 1000;

// ============================================================
// Types
// ============================================================
export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  systemPrompt: string;
  tools: string[];
  temperature: number;
  maxTokens: number;
  maxIterations: number;
}

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
// Pre-defined Agents
// ============================================================
export const AGENTS: Record<string, Agent> = {
  // Career Coach - Provides career advice
  coach: {
    id: 'coach',
    name: 'Orin Career Coach',
    role: 'career_coach',
    model: MODELS.primary.coach,
    systemPrompt: `You are Orin AI Coach, a personalized career coach for developers.

IMPORTANT: Use get_user_portfolio_summary to load the user's REAL data first.

Your role:
- Analyze developer portfolios using REAL data from their Supabase profile
- Provide career advice based on their ACTUAL skills and proofs
- Identify skill gaps and recommend learning paths
- Provide actionable, specific guidance
- Be encouraging but honest

Use emojis to make responses engaging:
🎯 for goals, 💡 for tips, 🚀 for growth, ✅ for recommendations, 📚 for learning, 💼 for career, 🌟 for highlights

Response format: JSON with "thinking" and "answer" fields.`,
    tools: [
      'get_user_portfolio_summary',
      'fetch_user_profile',
      'fetch_user_proofs',
      'extract_skills',
      'analyze_portfolio',
      'find_learning_resources',
      'fetch_opportunities',
      'calculate_skill_match'
    ],
    temperature: 0.7,
    maxTokens: 500,
    maxIterations: 3
  },

  // Skill Analyst - Extracts and analyzes skills
  skillAnalyst: {
    id: 'skillAnalyst',
    name: 'Orin Skill Analyst',
    role: 'skill_analyst',
    model: MODELS.fast.chat,
    systemPrompt: `You are Orin Skill Analyst. Extract, categorize, and analyze technical skills.

Your role:
- Extract skills from text, code, and profiles
- Categorize skills by type and level
- Identify skill relationships and dependencies
- Assess skill relevance to job requirements

Response format: JSON with "thinking", "answer", and "skills" fields.`,
    tools: ['extract_skills', 'analyze_code', 'detect_language'],
    temperature: 0.3,
    maxTokens: 400,
    maxIterations: 2
  },

  // Opportunity Matcher - Matches skills to opportunities
  opportunityMatcher: {
    id: 'opportunityMatcher',
    name: 'Orin Opportunity Matcher',
    role: 'opportunity_matcher',
    model: MODELS.toolCalling.primary,
    systemPrompt: `You are Orin Opportunity Matcher. Match developer skills to jobs, internships, and scholarships.

Your role:
- Analyze job requirements
- Calculate skill match scores
- Identify missing skills
- Provide improvement suggestions

Response format: JSON with "thinking", "answer", and "matches" fields.`,
    tools: ['fetch_opportunities', 'calculate_skill_match', 'extract_skills'],
    temperature: 0.3,
    maxTokens: 500,
    maxIterations: 3
  },

  // Learning Path Advisor - Creates personalized learning paths
  learningPathAdvisor: {
    id: 'learningPathAdvisor',
    name: 'Orin Learning Advisor',
    role: 'learning_advisor',
    model: MODELS.primary.learning,
    systemPrompt: `You are Orin Learning Advisor. Create personalized learning paths.

Your role:
- Identify skill gaps based on career goals
- Find free learning resources
- Create step-by-step learning plans
- Set milestones and timelines

Response format: JSON with "thinking", "answer", "steps", and "milestones" fields.`,
    tools: ['find_learning_resources', 'extract_skills', 'web_search', 'fetch_webpage'],
    temperature: 0.5,
    maxTokens: 800,
    maxIterations: 3
  },

  // Portfolio Scorer - Scores developer portfolios
  portfolioScorer: {
    id: 'portfolioScorer',
    name: 'Orin Portfolio Scorer',
    role: 'portfolio_scorer',
    model: MODELS.fast.chat,
    systemPrompt: `You are Orin Portfolio Scorer. Score developer portfolios from 0-100.

Scoring criteria (each 0-20 points):
1. Proof Count: 0 proofs=0, 1-2=5, 3-5=10, 6-10=15, 10+=20
2. Verification Rate: 0%=0, 25%=5, 50%=10, 75%=15, 100%=20
3. Skill Breadth: 1-2=5, 3-5=10, 6-10=15, 10+=20
4. Source Diversity: 1 type=5, 2 types=10, 3+ types=15, 4+ types=20
5. Recency: All old=5, mixed=10, recent=15, very active=20

Response format: JSON with "thinking", "answer", "score", "breakdown", and "grade" fields.`,
    tools: ['analyze_portfolio', 'extract_skills'],
    temperature: 0.3,
    maxTokens: 300,
    maxIterations: 1
  },

  // Verifier - Verifies proof sources
  verifier: {
    id: 'verifier',
    name: 'Orin Verifier',
    role: 'verifier',
    model: MODELS.fast.nano,
    systemPrompt: `You are Orin Verification Agent. Verify if proof sources are real and legitimate.

Your role:
- Verify GitHub repositories exist
- Check certificate URLs are valid
- Validate LinkedIn profiles
- Check Kaggle notebooks/datasets

Always use tools to verify. Never guess.
Response format: JSON with "thinking", "answer", and "verified" fields.`,
    tools: ['verify_github_repo', 'verify_github_user', 'verify_certificate', 'check_url_safety'],
    temperature: 0.3,
    maxTokens: 300,
    maxIterations: 3
  },

  // Chat - General conversation with full agentic capabilities
  chat: {
    id: 'chat',
    name: 'Orin Chat',
    role: 'chat',
    model: MODELS.fast.chat,
    systemPrompt: `You are Orin AI Assistant, a powerful agentic AI with access to real tools and the user's full portfolio data from Supabase.

CRITICAL: You MUST use the get_user_portfolio_summary tool at the start of EVERY conversation to load the user's real data. This gives you their profile, skills, proofs, and matched opportunities.

You are NOT just a chatbot - you are a full AI agent that can:
🔍 VERIFY: Check GitHub repos, certificates, LinkedIn profiles, Kaggle notebooks
📊 ANALYZE: Extract skills from code/text, analyze portfolios, detect languages
🎯 MATCH: Find job/internship opportunities that match the user's skills
📚 LEARN: Find free learning resources for any skill, create learning paths
💼 CAREER: Provide personalized career advice based on REAL portfolio data
🔧 TOOLS: Call tools to get real data, not guesses

When answering questions:
1. ALWAYS use get_user_portfolio_summary first to get real user data
2. Reference the user's ACTUAL skills, proofs, and profile
3. Give specific, actionable advice based on their real situation
4. Use tools to verify information before making recommendations
5. Use emojis to make responses engaging:
   - 🎯 for goals and targets
   - 💡 for ideas and tips
   - 🚀 for career growth and action items
   - ✅ for completed items or recommendations
   - 📚 for learning resources
   - 🔧 for tools and technical skills
   - 💼 for career and job-related advice
   - 🌟 for highlighting important points
   - 🔍 for analysis and verification
   - ⚡ for quick tips

Response format: JSON with "thinking" and "answer" fields.`,
    tools: [
      'get_user_portfolio_summary',
      'fetch_user_profile',
      'fetch_user_proofs',
      'fetch_opportunities',
      'verify_github_repo',
      'verify_github_user',
      'verify_certificate',
      'verify_kaggle',
      'verify_linkedin',
      'extract_skills',
      'analyze_portfolio',
      'analyze_code',
      'detect_language',
      'web_search',
      'fetch_webpage',
      'check_url_safety',
      'find_learning_resources',
      'calculate_skill_match',
      'save_conversation',
      'fetch_conversation_history'
    ],
    temperature: 0.7,
    maxTokens: 600,
    maxIterations: 5
  },

  // Safety Guard - Content moderation
  safetyGuard: {
    id: 'safetyGuard',
    name: 'Orin Safety Guard',
    role: 'safety_guard',
    model: MODELS.safety.content,
    systemPrompt: `You are Orin Safety Guard. Check if content is safe and appropriate.

Return JSON: {"User Safety": "safe" or "unsafe", "Response Safety": "safe" or "unsafe"}

Consider content unsafe if it contains:
- Harmful or abusive language
- Spam or phishing attempts
- Inappropriate content
- Personal attacks`,
    tools: [],
    temperature: 0.1,
    maxTokens: 100,
    maxIterations: 1
  }
};

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

    // Add conversation history
    if (context?.conversationHistory) {
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
      let parsed: any;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        parsed = { answer: content };
      }

      thinking = parsed.thinking || thinking;

      if (parsed.answer) {
        finalAnswer = parsed.answer;
        break;
      }

      if (parsed.tool_call) {
        const tool = tools.find(t => t.name === parsed.tool_call.name);
        if (tool) {
          const result = await tool.execute(parsed.tool_call.arguments, { userId: context?.userId });
          toolCalls.push({ tool: tool.name, args: parsed.tool_call.arguments, result });

          messages.push({ role: 'assistant', content: JSON.stringify({ tool_call: parsed.tool_call }) });
          messages.push({ role: 'user', content: `Tool result: ${JSON.stringify(result).substring(0, 1000)}` });
        }
      }
    }

    const durationMs = Date.now() - startTime;

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
    messages.push({ role: 'user', content: `${profileInfo}\n\nUser Query: ${query}` });

    // Tool calling loop with streaming
    let iterations = 0;
    let totalTokens = 0;
    let finalAnswer = '';
    let thinking = '';
    const toolCalls: AgentResult['toolCalls'] = [];
    const agentStartTime = Date.now();

    // Truncate query if too long
    const truncatedQuery = query.length > MAX_INPUT_LENGTH
      ? query.substring(0, MAX_INPUT_LENGTH) + '... (truncated)'
      : query;

    while (iterations < agent.maxIterations) {
      iterations++;

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
          onEvent('thinking', { content: parsed.thinking });
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
            args: parsed.tool_call.arguments,
            description: tool.description
          });

          const result = await tool.execute(parsed.tool_call.arguments, { userId: context.userId });
          toolCalls.push({ tool: tool.name, args: parsed.tool_call.arguments, result });

          onEvent('tool_result', {
            tool: tool.name,
            success: result.success,
            data: result.data,
            error: result.error
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
          agentId: 'skillAnalyst',
          query: `Analyze the user's skills and profile: ${query}`
        },
        {
          agentId: 'portfolioScorer',
          query: 'Score the user\'s portfolio based on their proofs and skills',
          dependsOn: ['skillAnalyst']
        },
        {
          agentId: 'opportunityMatcher',
          query: 'Find matching job opportunities based on the user\'s skills',
          dependsOn: ['skillAnalyst'],
          transform: (result) => `Based on these skills: ${result.answer}, find matching opportunities`
        },
        {
          agentId: 'learningPathAdvisor',
          query: 'Create a learning path based on skill gaps',
          dependsOn: ['skillAnalyst', 'opportunityMatcher'],
          transform: (result) => `Based on this analysis: ${result.answer}, create a learning path`
        },
        {
          agentId: 'coach',
          query: 'Provide career coaching advice',
          dependsOn: ['portfolioScorer', 'opportunityMatcher', 'learningPathAdvisor'],
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
          agentId: 'verifier',
          query: `Verify this ${sourceType} proof: ${proofUrl}`
        },
        {
          agentId: 'skillAnalyst',
          query: 'Extract skills from the verified proof',
          dependsOn: ['verifier'],
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
