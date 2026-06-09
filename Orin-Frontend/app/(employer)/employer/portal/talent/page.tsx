'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const ALL_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js', 'AWS', 'Docker',
  'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Go', 'Rust', 'Java',
  'System Design', 'CI/CD', 'Terraform', 'Redis', 'Kafka', 'Vue.js',
];

const MOCK_CANDIDATES = [
  {
    id: '1',
    name: 'Sarah Chen',
    headline: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    proofScore: 92,
    skills: ['React', 'TypeScript', 'System Design', 'GraphQL'],
    proofCount: 18,
    endorsements: 47,
    verified: true,
    avatar: '👩‍💻',
    topProof: 'Led migration of 50K LOC monolith to micro-frontends, reducing deploy time by 73%',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    headline: 'Full Stack Developer',
    location: 'Austin, TX',
    proofScore: 87,
    skills: ['Node.js', 'React', 'AWS', 'PostgreSQL'],
    proofCount: 12,
    endorsements: 31,
    verified: true,
    avatar: '👨‍💻',
    topProof: 'Built real-time collaboration feature serving 10K concurrent users',
  },
  {
    id: '3',
    name: 'Priya Patel',
    headline: 'Backend Engineer',
    location: 'New York, NY',
    proofScore: 84,
    skills: ['Python', 'PostgreSQL', 'Docker', 'Kubernetes'],
    proofCount: 9,
    endorsements: 22,
    verified: true,
    avatar: '👩‍🔧',
    topProof: 'Designed and implemented API gateway handling 1M+ requests/day',
  },
  {
    id: '4',
    name: 'Alex Rivera',
    headline: 'DevOps Engineer',
    location: 'Seattle, WA',
    proofScore: 78,
    skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS'],
    proofCount: 7,
    endorsements: 18,
    verified: false,
    avatar: '🧑‍💻',
    topProof: 'Automated deployment pipeline reducing release cycle from 2 weeks to 2 hours',
  },
  {
    id: '5',
    name: 'Emily Zhang',
    headline: 'ML Engineer',
    location: 'Boston, MA',
    proofScore: 95,
    skills: ['Python', 'TensorFlow', 'Kubernetes', 'Go'],
    proofCount: 22,
    endorsements: 63,
    verified: true,
    avatar: '👩‍🔬',
    topProof: 'Deployed recommendation engine increasing user engagement by 34%',
  },
];

export default function TalentSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const filteredCandidates = MOCK_CANDIDATES.filter((c) => {
    const matchesQuery = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.headline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some((s) => c.skills.includes(s));
    const matchesScore = c.proofScore >= minScore;
    return matchesQuery && matchesSkills && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/employer/portal" className="text-xs font-medium mb-1 inline-block" style={{ color: 'var(--color-bloom)' }}>
            ← Back to Portal
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
            Talent Search
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Find candidates with verified proof, not just claims.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, or skill..."
            className="w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3 pl-10 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
          style={{
            backgroundColor: showFilters ? 'var(--color-bloom)' : 'var(--color-surface)',
            color: showFilters ? 'white' : 'var(--color-text-secondary)',
            border: `1px solid ${showFilters ? 'var(--color-bloom)' : 'var(--color-border)'}`,
          }}
        >
          🎯 Filters
        </button>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card-premium p-5 space-y-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                  Minimum Proof Score: {minScore}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full mt-2 accent-[var(--color-bloom)]"
                />
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Skills</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALL_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: selectedSkills.includes(skill) ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                        color: selectedSkills.includes(skill) ? 'white' : 'var(--color-text-secondary)',
                        border: `1px solid ${selectedSkills.includes(skill) ? 'var(--color-bloom)' : 'var(--color-border)'}`,
                      }}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        {filteredCandidates.length} candidates found
      </div>

      {/* Candidate cards */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => (
          <motion.div
            key={candidate.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Avatar */}
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
                {candidate.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>{candidate.name}</h3>
                  {candidate.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: 'var(--color-bloom)' }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{candidate.headline}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>📍 {candidate.location}</p>

                {/* Top proof */}
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)', border: '1px solid var(--color-border)' }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                    Top Proof
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-ink)' }}>
                    &quot;{candidate.topProof}&quot;
                  </p>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {candidate.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Score + actions */}
              <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: 'var(--color-bloom)', fontFamily: 'var(--font-heading)' }}>
                    {candidate.proofScore}
                  </div>
                  <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                    Proof Score
                  </div>
                </div>
                <div className="text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {candidate.proofCount} proofs · {candidate.endorsements} endorsements
                </div>
                <button className="btn-primary rounded-lg px-4 py-2 text-xs font-semibold mt-1">
                  Contact
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-semibold mt-3" style={{ color: 'var(--color-ink)' }}>No candidates found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Try adjusting your filters or search query.
          </p>
        </div>
      )}
    </div>
  );
}
