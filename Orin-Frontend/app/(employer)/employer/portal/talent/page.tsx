'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { useFollowStatus, useToggleFollow, useStartConversation } from '@/lib/social';

interface Candidate {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  proof_score: number;
  proof_count: number;
}

function CandidateCard({ candidate, currentUserId }: { candidate: Candidate; currentUserId: string }) {
  const router = useRouter();
  const { data: followData } = useFollowStatus(candidate.id, currentUserId);
  const toggleFollow = useToggleFollow();
  const startConvo = useStartConversation();

  const handleFollow = () => {
    toggleFollow.mutate({
      followerId: currentUserId,
      followingId: candidate.id,
      isFollowing: followData?.isFollowing || false,
    });
  };

  const handleContact = async () => {
    const convId = await startConvo.mutateAsync({ senderId: currentUserId, receiverId: candidate.id });
    router.push(`/dashboard/messages?conv=${convId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Avatar */}
        <Link href={`/p/${candidate.username}`} className="shrink-0">
          {candidate.avatar_url ? (
            <img src={candidate.avatar_url} alt={candidate.full_name || candidate.username} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
              {(candidate.full_name || candidate.username)?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/p/${candidate.username}`} className="block">
            <h3 className="text-base font-semibold hover:underline" style={{ color: 'var(--color-ink)' }}>
              {candidate.full_name || candidate.username}
            </h3>
          </Link>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>@{candidate.username}</p>
          {candidate.headline && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{candidate.headline}</p>
          )}
          {candidate.location && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>📍 {candidate.location}</p>
          )}
          {candidate.bio && (
            <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>{candidate.bio}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
              style={{
                backgroundColor: followData?.isFollowing ? 'var(--color-surface-dim)' : 'var(--color-bloom)',
                color: followData?.isFollowing ? 'var(--color-text-secondary)' : 'white',
                border: `1px solid ${followData?.isFollowing ? 'var(--color-border)' : 'var(--color-bloom)'}`,
              }}
            >
              {followData?.isFollowing ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={handleContact}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
            >
              💬
            </button>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: 'var(--color-bloom)' }}>{candidate.proof_score}</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Proof Score</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TalentSearchPage() {
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: currentDbUser } = useQuery({
    queryKey: ['current-db-user', authUser?.id],
    queryFn: async () => {
      if (!supabase || !authUser?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      return data;
    },
    enabled: !!authUser?.id,
  });

  // Fetch real candidates from Supabase
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['talent-search', searchQuery, minScore],
    queryFn: async () => {
      if (!supabase) return [];

      let query = supabase
        .from('users')
        .select('id, username, full_name, avatar_url, headline, location, bio')
        .eq('is_profile_public', true)
        .eq('account_status', 'active')
        .neq('id', currentDbUser?.id || '');

      if (searchQuery && searchQuery.length >= 2) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%`);
      }

      const { data: users, error } = await query.limit(20);
      if (error) throw error;

      // Get proof counts and scores for each user
      const candidates: Candidate[] = [];
      for (const u of users || []) {
        const { count: proofCount } = await supabase
          .from('proof_cards')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.id)
          .eq('verification_status', 'verified');

        // Simple proof score calculation: verified proofs * 10, capped at 100
        const proofScore = Math.min((proofCount || 0) * 10, 100);

        if (proofScore >= minScore) {
          candidates.push({
            ...u,
            proof_score: proofScore,
            proof_count: proofCount || 0,
          });
        }
      }

      // Sort by proof score descending
      return candidates.sort((a, b) => b.proof_score - a.proof_score);
    },
    enabled: true,
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
            placeholder="Search by name, username, or role..."
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
      {showFilters && (
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
        </div>
      )}

      {/* Results count */}
      <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        {candidates?.length || 0} candidates found
      </div>

      {/* Candidate cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  <div className="h-3 w-48 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : candidates && candidates.length > 0 ? (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} currentUserId={currentDbUser?.id || ''} />
          ))}
        </div>
      ) : (
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
