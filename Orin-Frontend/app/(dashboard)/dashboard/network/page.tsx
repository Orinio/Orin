'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUserSearch, useFollowStatus, useToggleFollow, useStartConversation } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

function UserCard({ user, currentUserId }: { user: any; currentUserId: string }) {
  const { data: followData } = useFollowStatus(user.id, currentUserId);
  const toggleFollow = useToggleFollow();
  const startConvo = useStartConversation();
  const [messageSent, setMessageSent] = useState(false);

  const handleFollow = () => {
    if (!currentUserId) return;
    toggleFollow.mutate({
      followerId: currentUserId,
      followingId: user.id,
      isFollowing: followData?.isFollowing || false,
    });
  };

  const handleMessage = async () => {
    if (!currentUserId) return;
    const convId = await startConvo.mutateAsync({ senderId: currentUserId, receiverId: user.id });
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/p/${user.username}`} className="shrink-0">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || user.username} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
              {(user.full_name || user.username)?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/p/${user.username}`} className="block">
            <h3 className="text-base font-semibold hover:underline" style={{ color: 'var(--color-ink)' }}>
              {user.full_name || user.username}
            </h3>
          </Link>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>@{user.username}</p>
          {user.headline && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{user.headline}</p>
          )}
          {user.location && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>📍 {user.location}</p>
          )}
          {user.bio && (
            <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>{user.bio}</p>
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
              onClick={handleMessage}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: messageSent ? 'var(--color-bloom)' : 'var(--color-surface-dim)',
                color: messageSent ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {messageSent ? '✓ Sent' : '💬'}
            </button>
          </div>
          {followData && (
            <div className="text-[10px] text-right" style={{ color: 'var(--color-text-tertiary)' }}>
              {followData.followerCount} followers · {followData.followingCount} following
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function NetworkPage() {
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useUserSearch(searchQuery);

  // Get current user's DB id
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
          Network
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Discover and connect with verified professionals.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people by name, username, or role..."
          className="w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3 pl-10 text-sm transition placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
      </div>

      {/* Results */}
      {searchQuery.length < 2 ? (
        <div className="text-center py-16">
          <span className="text-5xl">🌐</span>
          <h2 className="text-xl font-semibold mt-4" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
            Find your network
          </h2>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            Search for colleagues, classmates, or professionals in your field. Follow them to see their proof cards in your feed.
          </p>
        </div>
      ) : isLoading ? (
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
      ) : users && users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard key={user.id} user={user} currentUserId={currentDbUser?.id || ''} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-semibold mt-3" style={{ color: 'var(--color-ink)' }}>No results found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
