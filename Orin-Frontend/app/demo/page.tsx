'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, ArrowRight, Loader2, ExternalLink, Star, GitFork, Code2, Sparkles } from 'lucide-react';

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  url: string;
  updatedAt: string;
  isTopProject: boolean;
}

interface DemoResult {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  publicRepos: number;
  followers: number;
  repos: GitHubRepo[];
  topLanguages: Array<{ language: string; count: number }>;
  proofScore: number;
}

export default function DemoPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/demo/scan?username=${encodeURIComponent(username.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan GitHub profile');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>ORIN</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="badge-spark mb-4 inline-block"
          >
            No signup required
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-ink)' }}
          >
            See your proof cards instantly
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Enter your GitHub username and we'll show you what we'd verify — in seconds.
          </motion.p>
        </div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto mb-16"
        >
          <div
            className="flex items-center gap-3 p-2 rounded-2xl border-2 transition-all focus-within:border-[var(--color-bloom)]"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2 px-3" style={{ color: 'var(--color-text-secondary)' }}>
              <Github className="h-5 w-5" />
              <span className="text-sm">github.com/</span>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="your-username"
              className="flex-1 bg-transparent border-none outline-none text-lg font-medium"
              style={{ color: 'var(--color-ink)' }}
              disabled={loading}
            />
            <button
              onClick={handleScan}
              disabled={loading || !username.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Scan
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto mb-8 p-4 rounded-xl text-center"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Profile Card */}
              <div className="card-premium p-6 flex flex-col md:flex-row items-start gap-6">
                {result.avatarUrl && (
                  <img
                    src={result.avatarUrl}
                    alt={result.username}
                    className="w-20 h-20 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                      {result.name || result.username}
                    </h2>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      @{result.username}
                    </span>
                  </div>
                  {result.bio && (
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {result.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span><strong>{result.publicRepos}</strong> repos</span>
                    <span><strong>{result.followers}</strong> followers</span>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-3xl font-bold" style={{ color: 'var(--color-bloom)' }}>
                    {result.proofScore}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Proof Score
                  </div>
                </div>
              </div>

              {/* Top Languages */}
              <div className="card-premium p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                  <Code2 className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
                  Top Languages
                </h3>
                <div className="flex flex-wrap gap-3">
                  {result.topLanguages.map((lang, i) => (
                    <div
                      key={lang.language}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-ink)',
                      }}
                    >
                      <span className="font-medium">{lang.language}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {lang.count} repos
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proof Cards Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--color-bloom)' }} />
                  Proof Cards We'd Generate
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {result.repos.filter(r => r.isTopProject).map((repo, i) => (
                    <motion.div
                      key={repo.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="card-premium p-5 hover:scale-[1.02] transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold truncate" style={{ color: 'var(--color-ink)' }}>
                          {repo.name}
                        </h4>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 ml-2"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      {repo.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: 'var(--color-bloom)' }}
                            />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5" />
                          {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3.5 w-3.5" />
                          {repo.forks}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="card-premium p-8 text-center">
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                  Ready to turn these into verified proof?
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                  Sign up free to save your proof cards, get AI coaching, and share with recruiters.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link href="/signup" className="btn-primary">
                    Sign up free
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                  <Link href="/" className="btn-outline">
                    Learn more
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
