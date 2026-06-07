'use client';

import { useState, useCallback, useRef } from 'react';
import { Paperclip, X, FileText, Image, File, Loader2 } from 'lucide-react';

export interface AttachedFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  preview?: string;
  status: 'pending' | 'uploading' | 'ready' | 'error';
}

interface FileUploadProps {
  files: AttachedFile[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  maxFiles?: number;
  disabled?: boolean;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf') return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ files, onFilesAdd, onFileRemove, maxFiles = 5, disabled = false }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).slice(0, maxFiles - files.length);
    if (newFiles.length > 0) {
      onFilesAdd(newFiles);
    }
  }, [files.length, maxFiles, onFilesAdd]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  return (
    <div className="relative">
      {/* Attached files list */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map(f => {
            const Icon = getFileIcon(f.type);
            return (
              <div
                key={f.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs group"
                style={{
                  backgroundColor: 'var(--color-surface-dim)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                {f.status === 'uploading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--color-bloom)' }} />
                ) : (
                  <Icon className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                )}
                <span className="max-w-[120px] truncate font-medium">{f.name}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>{formatFileSize(f.size)}</span>
                <button
                  onClick={() => onFileRemove(f.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone (only shown when dragging) */}
      {dragOver && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-xl"
          style={{
            backgroundColor: 'var(--color-primary-soft)',
            border: '2px dashed var(--color-bloom)',
          }}
        >
          <div className="text-center">
            <Paperclip className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--color-bloom)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-bloom)' }}>Drop files here</p>
          </div>
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
      />

      {/* Attach button (integrated into input area) */}
      {!disabled && files.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)';
            e.currentTarget.style.color = 'var(--color-bloom)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
          title="Attach files"
        >
          <Paperclip className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
