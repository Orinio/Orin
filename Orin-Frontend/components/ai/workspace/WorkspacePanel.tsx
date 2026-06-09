'use client';

import { useState } from 'react';
import {
  Code2,
  FileText,
  Search,
  GitCompare,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  FolderOpen,
  File,
  FileCode,
} from 'lucide-react';

export type WorkspaceMode = 'chat' | 'build' | 'research' | 'review';

export interface WorkspaceArtifact {
  id: string;
  type: 'code' | 'file' | 'diff' | 'text' | 'link';
  title: string;
  content: string;
  language?: string;
  url?: string;
  createdAt: Date;
}

interface WorkspacePanelProps {
  mode: WorkspaceMode;
  artifacts: WorkspaceArtifact[];
  isStreaming: boolean;
}

const MODE_CONFIG: Record<WorkspaceMode, {
  icon: typeof Code2;
  label: string;
  color: string;
}> = {
  chat: { icon: FileText, label: 'Chat', color: 'var(--color-text-tertiary)' },
  build: { icon: Code2, label: 'Build', color: '#6366f1' },
  research: { icon: Search, label: 'Research', color: 'var(--color-ember)' },
  review: { icon: GitCompare, label: 'Review', color: 'var(--color-bloom)' },
};

function ArtifactCard({ artifact }: { artifact: WorkspaceArtifact }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const iconMap = {
    code: Code2,
    file: File,
    diff: GitCompare,
    text: FileText,
    link: ExternalLink,
  };
  const Icon = iconMap[artifact.type] || File;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02]"
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
        <span
          className="text-[11px] font-medium flex-1 truncate"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-body)' }}
        >
          {artifact.title}
        </span>
        {artifact.language && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-surface-dim)',
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {artifact.language}
          </span>
        )}
        {expanded
          ? <ChevronDown className="w-3 h-3 opacity-30" />
          : <ChevronRight className="w-3 h-3 opacity-30" />
        }
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {artifact.type === 'code' || artifact.type === 'diff' ? (
            <div className="relative">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1 rounded-md transition-all z-10"
                style={{
                  backgroundColor: 'var(--color-surface-dim)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              <pre
                className="p-3 text-[11px] leading-relaxed overflow-x-auto max-h-80"
                style={{
                  backgroundColor: 'var(--color-surface-dim)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-ink)',
                }}
              >
                {artifact.content}
              </pre>
            </div>
          ) : artifact.type === 'link' ? (
            <div className="px-3 py-2">
              <a
                href={artifact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] hover:underline"
                style={{ color: 'var(--color-bloom)', fontFamily: 'var(--font-body)' }}
              >
                <ExternalLink className="w-3 h-3" />
                {artifact.url}
              </a>
            </div>
          ) : (
            <div
              className="px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              {artifact.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkspacePanel({ mode, artifacts, isStreaming }: WorkspacePanelProps) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-3 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
        >
          {config.label}
        </span>
        {artifacts.length > 0 && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-surface-dim)',
              color: 'var(--color-text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {artifacts.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-8">
            <FolderOpen className="w-6 h-6 mb-3 opacity-15" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-[11px] text-center opacity-40" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
              {mode === 'build' && 'Code and files will appear here'}
              {mode === 'research' && 'Research findings will appear here'}
              {mode === 'review' && 'Diffs and reviews will appear here'}
              {mode === 'chat' && 'Artifacts from the conversation will appear here'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {artifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
