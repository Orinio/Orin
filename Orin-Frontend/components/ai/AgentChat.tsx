'use client';

import { useState, useRef, useEffect } from 'react';
import { api, type AgentResult } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentId?: string;
  toolCalls?: Array<{ tool: string; args: any; result: any }>;
  durationMs?: number;
}

interface AgentChatProps {
  initialAgent?: string;
  onMessageSent?: (message: string) => void;
}

export function AgentChat({ initialAgent = 'chat', onMessageSent }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    onMessageSent?.(userMessage);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    const newHistory = [...conversationHistory, { role: 'user', content: userMessage }];
    setConversationHistory(newHistory);

    try {
      const result = await api.agents.run(selectedAgent, userMessage, newHistory.slice(-10));

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.answer || 'I could not generate a response.',
        timestamp: new Date(),
        agentId: result.agentId,
        toolCalls: result.toolCalls,
        durationMs: result.durationMs
      };
      setMessages(prev => [...prev, assistantMsg]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white">
      {/* Header with Agent Selector */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Orin AI Agent</h3>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="chat">💬 Chat Assistant</option>
            <option value="coach">🎯 Career Coach</option>
            <option value="skillAnalyst">📊 Skill Analyst</option>
            <option value="opportunityMatcher">💼 Opportunity Matcher</option>
            <option value="learningPathAdvisor">📚 Learning Advisor</option>
            <option value="portfolioScorer">🏆 Portfolio Scorer</option>
            <option value="verifier">✅ Verifier</option>
          </select>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium">How can I help you today?</p>
            <p className="text-sm mt-2">I can help with career advice, skill analysis, portfolio review, and more.</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setInput('Analyze my skills and suggest improvements')}
                className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                📊 Analyze my skills and suggest improvements
              </button>
              <button
                onClick={() => setInput('Find job opportunities matching my skills')}
                className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                💼 Find job opportunities matching my skills
              </button>
              <button
                onClick={() => setInput('Create a learning path for my career goals')}
                className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                📚 Create a learning path for my career goals
              </button>
              <button
                onClick={() => setInput('Score my portfolio and give feedback')}
                className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                🏆 Score my portfolio and give feedback
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              
              {/* Tool Calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  <p className="font-medium">Used {message.toolCalls.length} tool(s):</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {message.toolCalls.map((tc, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded ${
                          message.role === 'user' ? 'bg-blue-400' : 'bg-gray-200'
                        }`}
                      >
                        {tc.tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString()}
                {message.durationMs && (
                  <span className="ml-2">• {(message.durationMs / 1000).toFixed(1)}s</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your career..."
            className="flex-1 resize-none border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
