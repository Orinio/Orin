'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Brain, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ai/MarkdownRenderer';

interface SharedMessage {
  content: string;
  role: string;
  agentName: string;
  thinking?: string;
  createdAt: string;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params?.id as string;
  const [message, setMessage] = useState<SharedMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;

    async function fetchShared() {
      try {
        const res = await fetch(`/api/ai/share/${shareId}`);
        const data = await res.json();

        if (data.success && data.data) {
          setMessage(data.data);
        } else {
          setError(data.error?.message || 'Shared message not found');
        }
      } catch {
        setError('Failed to load shared message');
      } finally {
        setLoading(false);
      }
    }

    fetchShared();
  }, [shareId]);

  const handleCopy = () => {
    if (message) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf9f5' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#c96442' }} />
          <span className="text-sm" style={{ color: '#8a8580', fontFamily: 'var(--font-body)' }}>
            Loading shared message...
          </span>
        </div>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf9f5' }}>
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: '#b0aaa0' }} />
          <h1 className="text-lg font-medium mb-2" style={{ color: '#3d3a35', fontFamily: 'Georgia, serif' }}>
            Message not found
          </h1>
          <p className="text-sm" style={{ color: '#8a8580' }}>
            {error || 'This shared message may have been removed or the link is invalid.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#faf9f5' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
            >
              <Brain className="w-5 h-5" style={{ color: '#c96442' }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>
                {message.agentName || 'Orin'}
              </h1>
              <p className="text-xs" style={{ color: '#b0aaa0' }}>
                Shared response
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-black/[0.04] active:scale-95"
              style={{ color: '#8a8580' }}
              title="Copy message"
            >
              {copied ? <Check className="w-4 h-4" style={{ color: '#10b981' }} /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href="/dashboard/ai-chat"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-black/[0.04]"
              style={{ color: '#c96442', border: '1px solid #e5e0d6' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Try Orin
            </a>
          </div>
        </div>

        {/* Thinking (if present) */}
        {message.thinking && (
          <div
            className="mb-6 rounded-xl p-4"
            style={{ backgroundColor: '#f0ece3', border: '1px solid #e5e0d6' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5" style={{ color: '#c96442' }} />
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: '#c96442', fontFamily: 'var(--font-mono)' }}
              >
                Reasoning
              </span>
            </div>
            <p
              className="text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: '#5b5950', fontFamily: 'var(--font-mono)' }}
            >
              {message.thinking}
            </p>
          </div>
        )}

        {/* Message content */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e0d6',
          }}
        >
          <div className="prose prose-sm max-w-none">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px]" style={{ color: '#b0aaa0' }}>
            {message.createdAt && new Date(message.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
