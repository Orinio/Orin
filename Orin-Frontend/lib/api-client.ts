import { supabase } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let cachedToken: string | null = null;
let cachedTokenExp = 0;

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (cachedToken && Date.now() < cachedTokenExp - 60_000) return cachedToken;
  if (!supabase) {
    try { return localStorage.getItem('token'); } catch { return null; }
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      const exp = session.expires_at ? session.expires_at * 1000 : Date.now() + 50 * 60_000;
      cachedTokenExp = exp;
      return cachedToken;
    }
  } catch {}
  try { return localStorage.getItem('token'); } catch { return null; }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = body?.error || {};
    throw new ApiError(
      error.message || `Request failed with status ${response.status}`,
      error.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Types matching backend response shapes
export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  description: string;
}

export interface Tool {
  name: string;
  description: string;
  category: string;
  parameters: any;
}

export interface AgentResult {
  agentId: string;
  answer: string;
  thinking: string;
  toolCalls: Array<{ tool: string; args: any; result: any }>;
  iterations: number;
  tokensUsed: number;
  durationMs: number;
}

export interface ChatResponse {
  content: string;
  thinking: string;
  tokensUsed?: number;
  iterations?: number;
  degraded?: boolean;
}

export interface SkillAnalysis {
  topSkills: Array<{ skill: string; count: number }>;
  totalSkills: number;
  uniqueSkills: number;
  skills: Array<{ skill: string; category: string; count: number; lastUsed: string }>;
  skillGaps: Array<{ skill: string; importance: string; category: string }>;
  recommendations: string[];
  proofCount: number;
  verifiedCount: number;
}

export interface OpportunityMatch {
  opportunityId: string;
  title: string;
  company: string;
  type: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: any;
  created_at: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  services: { database: string; nvidia: string };
  connections: number;
  uptime: number;
}

export const api = {
  // Health
  health: () =>
    request<HealthStatus>('/health'),

  // AI Agents
  agents: {
    list: () =>
      request<{ success: boolean; data: { agents: Agent[] } }>('/ai/agents')
        .then(r => r.data.agents),

    get: (id: string) =>
      request<{ success: boolean; data: Agent & { systemPrompt: string } }>(`/ai/agents/${id}`)
        .then(r => r.data),

    chat: (query: string, conversationHistory?: Array<{ role: string; content: string }>) =>
      request<{ success: boolean; data: AgentResult }>('/ai/agents/chat', {
        method: 'POST',
        body: JSON.stringify({ query, conversationHistory }),
      }).then(r => r.data),

    run: (agentId: string, query: string, conversationHistory?: Array<{ role: string; content: string }>) =>
      request<{ success: boolean; data: AgentResult }>(`/ai/agents/${agentId}/run`, {
        method: 'POST',
        body: JSON.stringify({ query, conversationHistory }),
      }).then(r => r.data),
  },

  // Tools
  tools: {
    list: () =>
      request<{ success: boolean; data: { tools: Tool[] } }>('/ai/tools')
        .then(r => r.data.tools),

    byCategory: (category: string) =>
      request<{ success: boolean; data: { tools: Tool[] } }>(`/ai/tools/${category}`)
        .then(r => r.data.tools),
  },

  // Workflows
  workflows: {
    careerAnalysis: (query: string) =>
      request<{ success: boolean; data: { workflow: string; results: Record<string, AgentResult> } }>(
        '/ai/workflows/career-analysis',
        { method: 'POST', body: JSON.stringify({ query }) }
      ).then(r => r.data),

    verifyProof: (proofUrl: string, sourceType: string) =>
      request<{ success: boolean; data: { workflow: string; results: Record<string, AgentResult> } }>(
        '/ai/workflows/verify-proof',
        { method: 'POST', body: JSON.stringify({ proofUrl, sourceType }) }
      ).then(r => r.data),
  },

  // Legacy AI Endpoints
  ai: {
    chat: (message: string, history?: Array<{ role: string; content: string }>) =>
      request<{ success: boolean; response: ChatResponse }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }).then(r => r.response),

    skills: (targetRole?: string) =>
      request<{ success: boolean; analysis: SkillAnalysis }>(`/ai/skills${targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : ''}`)
        .then(r => r.analysis),

    match: (limit?: number) =>
      request<{ success: boolean; matches: OpportunityMatch[]; skillAnalysis: any }>('/ai/match', {
        method: 'POST',
        body: JSON.stringify({ limit }),
      }).then(r => r.matches),

    learningPath: (targetRole: string, timeframe?: string) =>
      request<{ success: boolean; learningPath: string; thinking: string }>('/ai/learning-path', {
        method: 'POST',
        body: JSON.stringify({ targetRole, timeframe }),
      }).then(r => r.learningPath),

    score: () =>
      request<{ success: boolean; score: string; thinking: string }>('/ai/score', {
        method: 'POST',
      }),

    verify: (action: string, payload: Record<string, any>) =>
      request<{ success: boolean; action: string; result: any }>('/ai/verify', {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
      }).then(r => r.result),

    safety: (url?: string, email?: string) =>
      request<{ success: boolean; result: { safe: boolean; answer: string } }>('/ai/safety', {
        method: 'POST',
        body: JSON.stringify({ url, email }),
      }).then(r => r.result),
  },

  // Memory
  memory: {
    save: (type: string, content: any, metadata?: any) =>
      request<{ success: boolean; data: { saved: boolean } }>('/ai/memory/save', {
        method: 'POST',
        body: JSON.stringify({ type, content, metadata }),
      }),

    search: (query: string, limit?: number) =>
      request<{ success: boolean; data: { memories: MemoryEntry[] } }>(
        `/ai/memory/search?query=${encodeURIComponent(query)}${limit ? `&limit=${limit}` : ''}`
      ).then(r => r.data.memories),

    preferences: () =>
      request<{ success: boolean; data: { preferences: any } }>('/ai/memory/preferences')
        .then(r => r.data.preferences),

    skills: () =>
      request<{ success: boolean; data: { skills: any[] } }>('/ai/memory/skills')
        .then(r => r.data.skills),

    goals: (status?: string) =>
      request<{ success: boolean; data: { goals: any[] } }>(
        `/ai/memory/goals${status ? `?status=${encodeURIComponent(status)}` : ''}`
      ).then(r => r.data.goals),
  },

  // Jobs
  jobs: {
    list: () =>
      request<{ success: boolean; data: { jobs: any[] } }>('/jobs')
        .then(r => r.data),
  },

  // Metrics
  metrics: () =>
    request<any>('/metrics'),
};
