'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ProofCard {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  confidence: number;
  topics: string[];
  updatedAt: string;
}

interface Skill {
  name: string;
  category: string;
  confidence: number;
  sources: string[];
}

interface DemoResult {
  user: {
    login: string;
    name: string;
    avatar: string;
    bio: string | null;
    publicRepos: number;
    followers: number;
  };
  proofCards: ProofCard[];
  skills: Skill[];
  proofScore: number;
  proofScoreMessage: string;
  nextStep: string;
  isDemo: boolean;
}

export default function DemoPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleScan = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const resp = await fetch(`${API_BASE}/demo/github/${encodeURIComponent(trimmed)}`);
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Scan failed. Please try again.');
        return;
      }

      setResult(data);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Hero section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="badge-spark mb-6">Instant Demo — No Signup</div>
          <h1
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            See what your GitHub<br />
            <span className="gradient-text-ember">looks like as proof</span>
          </h1>
          <p
            className="text-lg mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Enter your GitHub username. We'll instantly turn your repos into Proof Cards, extract your skills, and show you your proof score. No login required.
          </p>

          {/* Input */}
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="GitHub username"
              className="flex-1 px-5 py-4 rounded-[var(--radius-lg)] text-base outline-none transition-all duration-200 focus:ring-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink)',
                ...(username ? { ringColor: 'var(--color-ember)' } : {}),
              }}
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleScan}
              disabled={loading || !username.trim()}
              className="btn-primary text-base px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  Scanning...
                </span>
              ) : (
                'Scan'
              )}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm"
              style={{ color: 'var(--color-ember)' }}
            >
              {error}
            </motion.p>
          )}
        </div>
      </section>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="px-6 pb-24"
          >
            <div className="max-w-5xl mx-auto">
              {/* Profile + Score */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                {/* User card */}
                <div className="card-base p-6 flex items-center gap-4 glow-border md:col-span-2">
                  <Image
                    src={result.user.avatar}
                    alt={result.user.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full ring-2 ring-white shadow-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate" style={{ color: 'var(--color-ink)' }}>
                      {result.user.name}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      @{result.user.login} &middot; {result.user.publicRepos} repos &middot; {result.user.followers} followers
                    </p>
                    {result.user.bio && (
                      <p className="text-sm mt-1 truncate" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                        {result.user.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Proof Score */}
                <div className="card-base p-6 text-center glow-border">
                  <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                    Proof Score
                  </p>
                  <div
                    className="text-5xl font-bold mb-2"
                    style={{ color: result.proofScore > 70 ? 'var(--color-bloom)' : result.proofScore > 40 ? 'var(--color-spark)' : 'var(--color-ember)' }}
                  >
                    {result.proofScore}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                    {result.proofScoreMessage}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {result.skills.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-ink)' }}>
                    Detected Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {result.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="card-base px-4 py-2 flex items-center gap-2"
                      >
                        <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                          {skill.name}
                        </span>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: skill.confidence > 75 ? 'var(--color-bloom)' : skill.confidence > 55 ? 'var(--color-spark)' : 'var(--color-surface)',
                            color: skill.confidence > 55 ? '#fff' : 'var(--color-ink)',
                          }}
                        >
                          {skill.confidence}%
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                          {skill.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proof Cards */}
              {result.proofCards.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-ink)' }}>
                    Your Proof Cards
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.proofCards.map((card) => (
                      <a
                        key={card.id}
                        href={card.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-base p-5 group hover-lift glow-border card-accent-bottom block"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-bold truncate flex-1 mr-2" style={{ color: 'var(--color-ink)' }}>
                            {card.title}
                          </h4>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: card.confidence > 80 ? 'var(--color-bloom)' : card.confidence > 60 ? 'var(--color-spark)' : 'var(--color-surface)',
                              color: card.confidence > 60 ? '#fff' : 'var(--color-ink)',
                            }}
                          >
                            {card.confidence}%
                          </span>
                        </div>
                        <p className="text-sm mb-3 leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                          {card.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                          {card.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
                              {card.language}
                            </span>
                          )}
                          {card.stars > 0 && <span>&#9733; {card.stars}</span>}
                          {card.forks > 0 && <span>&#9900; {card.forks}</span>}
                          <span className="ml-auto group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Next step + CTA */}
              <div className="card-base p-8 text-center glow-border max-w-xl mx-auto">
                <div className="badge-ember mb-4">What's Next</div>
                <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {result.nextStep}
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                  This is a demo scan. Sign up to save your Proof Cards, unlock the AI Coach, and get matched to real opportunities.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link href="/signup" className="btn-primary text-base">
                    Sign Up Free — Save Your Proof
                  </Link>
                  <Link href="/" className="btn-outline text-base">
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* No results yet */}
      {!result && !loading && !error && (
        <section className="px-6 pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="grid sm:grid-cols-3 gap-5 mt-8">
              {[
                { icon: '🔍', title: 'Instant scan', desc: 'We read your public GitHub data — no login, no OAuth, no permissions needed.' },
                { icon: '📊', title: 'Skill extraction', desc: 'AI detects your skills, languages, and proof points from your repos.' },
                { icon: '🎯', title: 'Actionable feedback', desc: 'Get your proof score and a specific next step to improve it.' },
              ].map((item) => (
                <div key={item.title} className="card-base p-6 text-center glow-border">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-ink)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
