'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/use-ai';
import { api, type Agent, type Tool, type AgentResult } from '@/lib/api-client';

// ============================================================
// Agent Dashboard Component
// ============================================================
export function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AgentResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'tools' | 'workflows'>('agents');

  useEffect(() => {
    loadAgentsAndTools();
  }, []);

  async function loadAgentsAndTools() {
    const [agentsData, toolsData] = await Promise.all([api.agents.list(), api.tools.list()]);
    setAgents(agentsData);
    setTools(toolsData);
  }

  async function handleRunAgent() {
    if (!selectedAgent || !query.trim()) return;

    setIsLoading(true);
    try {
      const result = await api.agents.run(selectedAgent.id, query);
      setResult(result);
    } catch (error) {
      console.error('Failed to run agent:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCareerAnalysis() {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const { results } = await api.workflows.careerAnalysis(query);
      // Combine results from all agents
      const combinedResult: AgentResult = {
        agentId: 'career-analysis',
        answer: Object.values(results).map(r => r.answer).join('\n\n'),
        thinking: Object.values(results).map(r => r.thinking).join('\n'),
        toolCalls: Object.values(results).flatMap(r => r.toolCalls),
        iterations: Object.values(results).reduce((sum, r) => sum + r.iterations, 0),
        tokensUsed: Object.values(results).reduce((sum, r) => sum + r.tokensUsed, 0),
        durationMs: Object.values(results).reduce((sum, r) => sum + r.durationMs, 0)
      };
      setResult(combinedResult);
    } catch (error) {
      console.error('Failed to run career analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orin AI Agents</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'agents' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Agents ({agents.length})
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'tools' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Tools ({tools.length})
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-lg ${activeTab === 'workflows' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Workflows
        </button>
      </div>

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Available Agents</h2>
            <div className="space-y-2">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedAgent?.id === agent.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.role}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.tools.slice(0, 3).map(tool => (
                      <span key={tool} className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {tool}
                      </span>
                    ))}
                    {agent.tools.length > 3 && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        +{agent.tools.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Details & Query */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
            {selectedAgent ? (
              <>
                <h2 className="text-xl font-semibold mb-2">{selectedAgent.name}</h2>
                <p className="text-gray-600 mb-4">{selectedAgent.description}</p>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Model: {selectedAgent.model}</p>
                  <p className="text-sm text-gray-500">Tools: {selectedAgent.tools.join(', ')}</p>
                </div>

                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your query..."
                  className="w-full border rounded-lg p-3 mb-4"
                  rows={4}
                />

                <button
                  onClick={handleRunAgent}
                  disabled={isLoading || !query.trim()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Running...' : 'Run Agent'}
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Select an agent to get started
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Available Tools ({tools.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => (
              <div key={tool.name} className="border rounded-lg p-4">
                <h3 className="font-medium">{tool.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{tool.description}</p>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {tool.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">AI Workflows</h2>
          
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium text-lg">Career Analysis Workflow</h3>
            <p className="text-gray-600 mb-4">
              Runs multiple agents in sequence: Skill Analysis → Portfolio Scoring → 
              Opportunity Matching → Learning Path → Career Coaching
            </p>
            
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your career goals and current skills..."
              className="w-full border rounded-lg p-3 mb-4"
              rows={4}
            />

            <button
              onClick={handleCareerAnalysis}
              disabled={isLoading || !query.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? 'Running Analysis...' : 'Run Career Analysis'}
            </button>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-600">{result.toolCalls.length}</p>
              <p className="text-sm text-gray-500">Tools Used</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{result.iterations}</p>
              <p className="text-sm text-gray-500">Iterations</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-600">{result.tokensUsed}</p>
              <p className="text-sm text-gray-500">Tokens</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-orange-600">{(result.durationMs / 1000).toFixed(1)}s</p>
              <p className="text-sm text-gray-500">Duration</p>
            </div>
          </div>

          {result.thinking && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Thinking:</p>
              <p className="text-sm text-gray-600">{result.thinking}</p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-medium text-blue-800 mb-2">Answer:</p>
            <p className="whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.toolCalls.length > 0 && (
            <div className="mt-4">
              <p className="font-medium mb-2">Tool Calls:</p>
              <div className="space-y-2">
                {result.toolCalls.map((tc, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2 text-sm">
                    <span className="font-medium">{tc.tool}</span>
                    <span className="text-gray-500 ml-2">
                      {JSON.stringify(tc.args).substring(0, 100)}...
                    </span>
                    {tc.result.success && (
                      <span className="text-green-500 ml-2">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
