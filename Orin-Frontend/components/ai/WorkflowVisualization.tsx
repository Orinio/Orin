'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

interface WorkflowStep {
  agentId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  durationMs?: number;
}

interface WorkflowVisualizationProps {
  workflowName: string;
  steps: WorkflowStep[];
  isRunning: boolean;
}

export function WorkflowVisualization({ workflowName, steps, isRunning }: WorkflowVisualizationProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">{workflowName}</h3>
      
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.agentId} className="relative flex items-start">
              {/* Step Indicator */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                  step.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : step.status === 'running'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : step.status === 'failed'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.status === 'completed' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.status === 'running' && (
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {step.status === 'failed' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {step.status === 'pending' && (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.name}</h4>
                  {step.durationMs && (
                    <span className="text-sm text-gray-500">
                      {(step.durationMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
                
                {step.result && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="whitespace-pre-wrap line-clamp-3">{step.result.answer}</p>
                    {step.result.toolCalls && step.result.toolCalls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.result.toolCalls.map((tc: any, i: number) => (
                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {tc.tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {steps.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {steps.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {steps.filter(s => s.status === 'running').length}
              </p>
              <p className="text-sm text-gray-500">Running</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {steps.filter(s => s.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Career Analysis Workflow Component
// ============================================================

interface CareerAnalysisWorkflowProps {
  onComplete?: (results: any) => void;
}

export function CareerAnalysisWorkflow({ onComplete }: CareerAnalysisWorkflowProps) {
  const [query, setQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { agentId: 'skillAnalyst', name: 'Skill Analysis', status: 'pending' },
    { agentId: 'portfolioScorer', name: 'Portfolio Scoring', status: 'pending' },
    { agentId: 'opportunityMatcher', name: 'Opportunity Matching', status: 'pending' },
    { agentId: 'learningPathAdvisor', name: 'Learning Path', status: 'pending' },
    { agentId: 'coach', name: 'Career Coaching', status: 'pending' }
  ]);

  const runWorkflow = async () => {
    if (!query.trim()) return;

    setIsRunning(true);
    setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'running' } : s));

    try {
      const { results } = await api.workflows.careerAnalysis(query);

      setSteps(prev => prev.map((step) => {
        const agentResult = results[step.agentId];
        if (agentResult) {
          return {
            ...step,
            status: 'completed',
            result: agentResult,
            durationMs: agentResult.durationMs
          };
        }
        return step;
      }));

      onComplete?.(results);
    } catch (error) {
      setSteps(prev => prev.map(s => 
        s.status === 'running' ? { ...s, status: 'failed' } : s
      ));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Career Analysis Workflow</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This workflow will analyze your career profile using multiple AI agents:
        </p>
        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
          <li><strong>Skill Analyst</strong> - Extracts and categorizes your skills</li>
          <li><strong>Portfolio Scorer</strong> - Scores your portfolio from 0-100</li>
          <li><strong>Opportunity Matcher</strong> - Finds matching job opportunities</li>
          <li><strong>Learning Advisor</strong> - Creates personalized learning paths</li>
          <li><strong>Career Coach</strong> - Provides final career advice</li>
        </ol>
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe your career goals, current skills, and what you're looking for..."
        className="w-full border rounded-lg p-3 mb-4"
        rows={4}
        disabled={isRunning}
      />

      <button
        onClick={runWorkflow}
        disabled={isRunning || !query.trim()}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 font-medium"
      >
        {isRunning ? 'Running Analysis...' : 'Start Career Analysis'}
      </button>

      <div className="mt-8">
        <WorkflowVisualization
          workflowName="Career Analysis"
          steps={steps}
          isRunning={isRunning}
        />
      </div>
    </div>
  );
}
