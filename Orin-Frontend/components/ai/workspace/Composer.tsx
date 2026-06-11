'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, StopCircle, ChevronDown, Sparkles, ArrowUp } from 'lucide-react';
import { CHAT_MODELS } from '@/components/ai/ChatInput';

interface ComposerProps {
  onSend: (message: string, files?: File[], modelId?: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const SUGGESTIONS = [
  { label: 'Analyze my portfolio', icon: '📊', prompt: 'Analyze my portfolio and suggest improvements for my target role' },
  { label: 'Find opportunities', icon: '🎯', prompt: 'Find job opportunities that match my skills and experience' },
  { label: 'Learning path', icon: '📚', prompt: 'Create a personalized learning path for my career goals' },
  { label: 'Verify projects', icon: '✓', prompt: 'Verify my GitHub projects and certifications' },
];

export default function Composer({
  onSend,
  onStop,
  disabled,
  isStreaming,
  selectedModel,
  onModelChange,
}: ComposerProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) || CHAT_MODELS[0];

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
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selected].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSuggestion = useCallback((prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  }, []);

  const hasInput = input.trim().length > 0;

  return (
    <div className="px-3 pb-3" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Suggestions row (only when empty) */}
      {!hasInput && files.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSuggestion(s.prompt)}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink)',
              }}
            >
              <span className="text-xs">{s.icon}</span>
              <span>{s.label}</span>
              <ArrowUp className="w-3 h-3 opacity-0 -ml-1 transition-all duration-200 group-hover:opacity-40 group-hover:ml-0" />
            </button>
          ))}
        </div>
      )}

      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {files.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-surface-dim)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Paperclip className="w-2.5 h-2.5 opacity-40" />
              {f.name}
              <button
                onClick={() => removeFile(i)}
                className="ml-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-black/10 transition-all"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input container */}
      <div
        className="relative flex items-end gap-2 rounded-2xl transition-all duration-300"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: hasInput ? '1.5px solid var(--color-bloom)' : '1.5px solid var(--color-border)',
          boxShadow: hasInput
            ? '0 0 0 3px rgba(11,171,119,0.1), 0 4px 16px rgba(0,0,0,0.06)'
            : '0 2px 8px rgba(0,0,0,0.04)',
          padding: '10px 12px',
        }}
      >
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-1.5 rounded-lg transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
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
          className="flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed focus:outline-none placeholder:opacity-30 disabled:opacity-40"
          style={{
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-body)',
            maxHeight: '160px',
          }}
        />

        {/* Model selector */}
        <div className="relative" ref={modelMenuRef}>
          <button
            onClick={() => setModelOpen(!modelOpen)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 hover:bg-black/[0.04] whitespace-nowrap"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentModel.badgeColor || 'var(--color-bloom)' }}
            />
            <span className="hidden sm:inline">{currentModel.name.split(' ').slice(0, 2).join(' ')}</span>
            <ChevronDown className="w-3 h-3 opacity-30" />
          </button>

          {modelOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
              <div
                className="absolute bottom-full right-0 mb-2 w-72 rounded-2xl overflow-hidden z-50"
                style={{
                  backgroundColor: 'var(--color-paper)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)',
                }}
              >
                <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  Select Model
                </div>
                <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
                  {CHAT_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { onModelChange(model.id); setModelOpen(false); }}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 rounded-xl transition-all duration-150"
                      style={{
                        backgroundColor: model.id === currentModel.id ? `${model.badgeColor || 'var(--color-bloom)'}10` : undefined,
                        border: model.id === currentModel.id ? `1px solid ${model.badgeColor || 'var(--color-bloom)'}20` : '1px solid transparent',
                      }}
                      onMouseEnter={e => { if (model.id !== currentModel.id) e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)'; }}
                      onMouseLeave={e => { if (model.id !== currentModel.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: model.badgeColor || 'var(--color-bloom)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                          {model.name}
                        </div>
                        <div className="text-[10px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                          {model.provider}
                        </div>
                      </div>
                      {model.badge && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                          style={{
                            backgroundColor: `${model.badgeColor || 'var(--color-bloom)'}15`,
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
            className="flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, var(--color-pulse), #dc2626)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(238,66,102,0.3)',
            }}
            title="Stop generating"
          >
            <StopCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={disabled || !hasInput}
            className="flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 disabled:opacity-20 active:scale-95"
            style={{
              background: hasInput
                ? 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)'
                : 'var(--color-border)',
              color: hasInput ? 'white' : 'var(--color-mist)',
              boxShadow: hasInput ? '0 2px 8px rgba(11,171,119,0.3)' : 'none',
            }}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hint */}
      <p className="text-center text-[10px] mt-2 opacity-25" style={{ fontFamily: 'var(--font-body)' }}>
        Shift+Enter for new line · Enter to send
      </p>
    </div>
  );
}
