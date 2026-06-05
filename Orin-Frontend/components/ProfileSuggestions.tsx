'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

interface ProfileSuggestionsProps {
  username: string;
  skills: string[];
  proofCount: number;
  verifiedCount: number;
}

interface Suggestion {
  type: 'strength' | 'improvement' | 'action';
  text: string;
}

export default function ProfileSuggestions({ username, skills, proofCount, verifiedCount }: ProfileSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'custom',
          query: `Analyze this public profile and provide 3-5 concise suggestions for improvement:

Username: ${username}
Skills: ${skills.slice(0, 10).join(', ') || 'None listed'}
Total Proofs: ${proofCount}
Verified Proofs: ${verifiedCount}

Provide suggestions as a JSON array with objects containing:
- type: "strength", "improvement", or "action"
- text: brief suggestion (1-2 sentences)

Focus on:
1. Profile strengths to highlight
2. Areas for improvement
3. Specific actions to take

Return only the JSON array, no other text.`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      const answer = data.result?.answer || '';

      // Parse the AI response - try to extract JSON
      const jsonMatch = answer.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setSuggestions(parsed);
        } catch {
          // If JSON parsing fails, create suggestions from text
          setSuggestions([
            { type: 'action', text: answer.slice(0, 200) }
          ]);
        }
      } else {
        setSuggestions([
          { type: 'action', text: answer.slice(0, 200) }
        ]);
      }

      setShowSuggestions(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strength': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'improvement': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default: return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'border-emerald-200 bg-emerald-50';
      case 'improvement': return 'border-amber-200 bg-amber-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="mt-6">
      {!showSuggestions ? (
        <button
          onClick={generateSuggestions}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-neutral-text)] transition hover:border-[var(--color-primary-emerald)] hover:text-[var(--color-primary-emerald)] disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Analyzing...' : 'Get AI Profile Suggestions'}
        </button>
      ) : (
        <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-neutral-text)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-primary-emerald)]" />
              AI Profile Suggestions
            </h3>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-[var(--color-neutral-text-tertiary)] hover:text-[var(--color-neutral-text-secondary)]"
            >
              Hide
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                className={`rounded-lg border p-3 ${getTypeColor(suggestion.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getTypeIcon(suggestion.type)}
                  <p className="text-sm text-[var(--color-neutral-text)]">{suggestion.text}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="mt-3 text-xs text-[var(--color-neutral-text-tertiary)] hover:text-[var(--color-neutral-text-secondary)] flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh suggestions
          </button>
        </div>
      )}
    </div>
  );
}
