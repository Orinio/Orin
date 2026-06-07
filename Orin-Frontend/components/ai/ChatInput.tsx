'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, StopCircle, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  { label: 'Analyze my portfolio', icon: '📊' },
  { label: 'Find opportunities for me', icon: '🎯' },
  { label: 'Create a learning path', icon: '📚' },
  { label: 'Verify my GitHub projects', icon: '✓' },
];

export default function ChatInput({ onSend, onStop, disabled, isStreaming }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, files, disabled, onSend]);

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
    <div className="w-full max-w-3xl mx-auto px-4 pb-6">
      {/* Suggestions row - only show when empty */}
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

        {/* Send / Stop button */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex-shrink-0 p-2 rounded-xl transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-pulse)',
              color: 'white',
            }}
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

      {/* Subtle hint */}
      <p
        className="text-center text-[10px] mt-2 opacity-30"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Orin routes your message to the best agent automatically
      </p>
    </div>
  );
}
