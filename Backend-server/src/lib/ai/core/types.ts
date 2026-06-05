export interface Tool {
  name: string;
  description: string;
  category: 'verification' | 'search' | 'analysis' | 'safety' | 'data';
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  execute: (args: Record<string, any>) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AgentResponse {
  thinking?: string;
  tool_call?: ToolCall;
  answer?: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  maxIterations: number;
  tools: string[];
  systemPrompt: string;
  outputFormat: 'json' | 'text' | 'streaming';
}

export interface AgentContext {
  userId: string;
  userProfile: any;
  proofs: any[];
  skillAnalysis?: any;
  opportunities?: any[];
  conversationHistory?: Array<{ role: string; content: string }>;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  agentId: string;
  answer: string;
  thinking: string;
  toolCalls: Array<{
    tool: string;
    args: any;
    result: ToolResult;
  }>;
  iterations: number;
  totalTokens: number;
  model: string;
  durationMs: number;
}

export interface AgentConfig {
  model?: string;
  maxIterations?: number;
  temperature?: number;
  maxTokens?: number;
}
