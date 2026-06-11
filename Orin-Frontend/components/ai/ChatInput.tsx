'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, StopCircle, ChevronDown } from 'lucide-react';

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  badge?: string;
  badgeColor?: string;
}

export const CHAT_MODELS: ChatModel[] = [
  { id: 'auto', name: 'Auto (Fastest)', provider: 'Smart routing', badge: '⚡', badgeColor: '#10b981' },
  { id: 'qwen/qwen3.5-397b-a17b', name: 'Qwen 3.5 397B', provider: 'Qwen', badge: 'Fast', badgeColor: 'var(--color-bloom)' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b', name: 'Nemotron-3 Ultra 550B', provider: 'NVIDIA', badge: 'Agent', badgeColor: 'var(--color-ember)' },
  { id: 'qwen/qwen3-coder-480b-a35b-instruct', name: 'Qwen3 Coder 480B', provider: 'Qwen', badge: 'Code', badgeColor: '#6366f1' },
  { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6', provider: 'Moonshot', badge: '54 AA', badgeColor: '#8b5cf6' },
  { id: 'z-ai/glm-5.1', name: 'GLM-5.1', provider: 'Z.AI', badge: '58.4%', badgeColor: '#06b6d4' },
  { id: 'deepseek-ai/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', badge: 'Pro', badgeColor: 'var(--color-pulse)' },
  { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'DeepSeek', badge: 'Flash', badgeColor: 'var(--color-spark)' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', badge: 'Think', badgeColor: '#6366f1' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI', badge: 'Think', badgeColor: '#8b5cf6' },
  { id: 'google/gemma-4-31b-it', name: 'Gemma 4 31B', provider: 'Google', badge: 'Think', badgeColor: '#06b6d4' },
  { id: 'minimaxai/minimax-m2.7', name: 'MiniMax M2.7', provider: 'MiniMax' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron-3 Super 120B', provider: 'NVIDIA' },
  { id: 'meta/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', provider: 'Meta' },
  { id: 'mistralai/mistral-large-3-675b-instruct-2512', name: 'Mistral Large 3 675B', provider: 'Mistral' },
];

interface ChatInputProps {
  onSend: (message: string, files?: File[], model?: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

const SUGGESTIONS = [
  { label: 'Analyze my portfolio', icon: '📊' },
  { label: 'Find opportunities for me', icon: '🎯' },
  { label: 'Create a learning path', icon: '📚' },
  { label: 'Verify my GitHub projects', icon: '✓' },
];

export default function ChatInput({ onSend, onStop, disabled, isStreaming, selectedModel, onModelChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const currentModel = CHAT_MODELS.find(m => m.id === (selectedModel || CHAT_MODELS[0].id)) || CHAT_MODELS[0];

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, files.length > 0 ? files : undefined, currentModel.id);
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, files, disabled, onSend, currentModel.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleInput = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSuggestion = useCallback((label: string) => {
    setInput(label);
    textareaRef.current?.focus();
  }, []);

  const hasInput = input.trim().length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Suggestions row */}
      {!hasInput && files.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink)',
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
              style={{
                backgroundColor: 'var(--color-surface-dim)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Paperclip className="w-3 h-3 opacity-50" />
              {f.name}
              <button onClick={() => removeFile(i)} className="ml-0.5 opacity-50 hover:opacity-100">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Input container */}
      <div
        className="relative flex items-end gap-2 rounded-2xl transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          boxShadow: hasInput ? '0 0 0 2px var(--color-pulse), 0 4px 12px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.04)',
          padding: '10px 12px',
        }}
      >
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors duration-150 hover:bg-black/5"
          style={{ color: 'var(--color-mist)' }}
          title="Attach files"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.md,.json,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask Orin anything..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed focus:outline-none placeholder:opacity-40 disabled:opacity-40"
          style={{
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-body)',
            maxHeight: '200px',
          }}
        />

        {/* Model selector */}
        <div className="relative" ref={modelMenuRef}>
          <button
            onClick={() => setModelOpen(!modelOpen)}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-150 hover:bg-black/5 whitespace-nowrap"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: currentModel.badgeColor || 'var(--color-bloom)' }}
            />
            {currentModel.name.split(' ').slice(0, 2).join(' ')}
            <ChevronDown className="w-3 h-3 opacity-40" />
          </button>

          {modelOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
              <div
                className="absolute bottom-full right-0 mb-2 w-72 rounded-xl overflow-hidden z-50"
                style={{
                  backgroundColor: 'var(--color-paper)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                }}
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Select Model
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {CHAT_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { onModelChange?.(model.id); setModelOpen(false); }}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors duration-100"
                      style={{
                        backgroundColor: model.id === currentModel.id ? 'var(--color-surface-dim)' : undefined,
                        borderTop: '1px solid var(--color-border)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)'}
                      onMouseLeave={e => { if (model.id !== currentModel.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: model.badgeColor || 'var(--color-bloom)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: 'var(--color-ink)' }}>
                          {model.name}
                        </div>
                        <div className="text-[10px] opacity-40" style={{ fontFamily: 'var(--font-mono)' }}>
                          {model.provider}
                        </div>
                      </div>
                      {model.badge && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{
                            backgroundColor: `${model.badgeColor || 'var(--color-bloom)'}18`,
                            color: model.badgeColor || 'var(--color-bloom)',
                          }}
                        >
                          {model.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex-shrink-0 p-2 rounded-xl transition-all duration-200"
            style={{ backgroundColor: 'var(--color-pulse)', color: 'white' }}
            title="Stop generating"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={disabled || !hasInput}
            className="flex-shrink-0 p-2 rounded-xl transition-all duration-200 disabled:opacity-20"
            style={{
              backgroundColor: hasInput ? 'var(--color-ink)' : 'var(--color-border)',
              color: hasInput ? 'var(--color-paper)' : 'var(--color-mist)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hint */}
      <p className="text-center text-[10px] mt-2 opacity-30" style={{ fontFamily: 'var(--font-body)' }}>
        Shift+Enter for new line · Enter to send
      </p>
    </div>
  );
}
