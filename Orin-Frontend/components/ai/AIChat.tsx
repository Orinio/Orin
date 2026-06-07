'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/hooks/use-ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{ tool: string; args: any; result: any }>;
}

interface AIChatProps {
  initialMessage?: string;
  onMessageSent?: (message: string) => void;
  onResponseReceived?: (response: string) => void;
}

export function AIChat({ initialMessage, onMessageSent, onResponseReceived }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { sendMessage, isLoading, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isNearBottom]);

  useEffect(() => {
    if (initialMessage) {
      setMessages([{
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [initialMessage]);

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 50);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    onMessageSent?.(userMessage);

    const result = await sendMessage(userMessage);

    if (result) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.answer || 'I could not generate a response.',
        timestamp: new Date(),
        toolCalls: result.toolCalls
      }]);

      onResponseReceived?.(result.answer);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg" style={{ 
      borderColor: 'var(--color-neutral-border)',
      backgroundColor: 'var(--color-neutral-surface)'
    }}>
      {/* Messages Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6 sm:py-8" style={{ color: 'var(--color-neutral-text-secondary)' }}>
            <p className="text-base sm:text-lg font-medium" style={{ color: 'var(--color-neutral-text)' }}>Orin AI Assistant</p>
            <p className="text-xs sm:text-sm">Ask me anything about your career, skills, or portfolio.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 py-2.5 sm:p-3 ${
                message.role === 'user'
                  ? 'text-white'
                  : ''
              }`}
              style={{ 
                backgroundColor: message.role === 'user' 
                  ? 'var(--color-primary-emerald)' 
                  : 'var(--color-neutral-surface-alt)',
                color: message.role === 'user' 
                  ? 'white' 
                  : 'var(--color-neutral-text)'
              }}
            >
              <p className="whitespace-pre-wrap text-xs sm:text-sm">{message.content}</p>
              
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-2 text-[10px] sm:text-xs opacity-75">
                  <p>Used {message.toolCalls.length} tool(s):</p>
                  <ul className="list-disc list-inside">
                    {message.toolCalls.map((tc, i) => (
                      <li key={i}>{tc.tool}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className={`text-[10px] sm:text-xs mt-1 ${message.role === 'user' ? 'opacity-75' : ''}`}
                 style={{ color: message.role === 'user' ? 'white' : 'var(--color-neutral-text-secondary)' }}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2.5 sm:p-3" style={{ backgroundColor: 'var(--color-neutral-surface-alt)' }}>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-neutral-text-secondary)', animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-neutral-text-secondary)', animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-neutral-text-secondary)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="rounded-lg px-3 py-2.5 sm:p-3 text-xs sm:text-sm" 
                 style={{ 
                   backgroundColor: 'var(--color-accent-danger-light)',
                   color: 'var(--color-accent-danger)'
                 }}>
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="border-t p-3 sm:p-4" style={{ borderColor: 'var(--color-neutral-border)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about your career..."
            className="flex-1 resize-none border rounded-lg px-3 py-2 sm:p-2 text-xs sm:text-sm focus:outline-none focus:ring-2 max-h-[100px]"
            style={{ 
              borderColor: 'var(--color-neutral-border)',
              backgroundColor: 'var(--color-neutral-surface)',
              color: 'var(--color-neutral-text)'
            }}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 sm:px-4 sm:py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex-shrink-0 font-semibold transition-colors"
            style={{ 
              backgroundColor: 'var(--color-primary-emerald)',
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
