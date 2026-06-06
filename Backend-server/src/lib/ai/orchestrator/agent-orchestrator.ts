/**
 * Orin AI - Agent Orchestrator
 * Manages multiple AI agents working together
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../logger.js';
import { MODELS } from '../core/models.js';
import { chatCompletion } from '../core/nvidia.js';
import { createMemoryManager, type MemoryManager } from '../memory/memory-manager.js';
import { getToolsByNames, type ToolResult } from '../tools/tool-registry.js';

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

Your role:
- Analyze developer portfolios and provide career advice
- Identify skill gaps and recommend learning paths
- Provide actionable, specific guidance
- Be encouraging but honest

Response format: JSON with "thinking" and "answer" fields.`,
    tools: ['extract_skills', 'analyze_portfolio', 'find_learning_resources'],
    temperature: 0.7,
    maxTokens: 500,
    maxIterations: 2
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

  // Chat - General conversation
  chat: {
    id: 'chat',
    name: 'Orin Chat',
    role: 'chat',
    model: MODELS.fast.chat,
    systemPrompt: `You are Orin AI Assistant, a helpful career advisor for developers.

You can help with:
1. Career advice and planning
2. Skill gap analysis
3. Resume/portfolio improvement
4. Job search strategies
5. Interview preparation
6. GitHub project ideas
7. Certifications to pursue

Be concise, specific, and actionable. Reference user's skills when giving advice.
Response format: JSON with "thinking" and "answer" fields.`,
    tools: ['extract_skills', 'web_search', 'fetch_webpage', 'analyze_portfolio'],
    temperature: 0.7,
    maxTokens: 500,
    maxIterations: 3
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
