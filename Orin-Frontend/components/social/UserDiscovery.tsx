'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, UserCheck, MapPin } from 'lucide-react';
import { useSuggestedUsers, useSearchUsers, type DiscoverableUser } from '@/lib/social-posts';
import { useToggleFollow, useFollowStatus } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

function UserCard({ user, currentUserId }: { user: DiscoverableUser; currentUserId: string }) {
  const { data: followData } = useFollowStatus(user.id, currentUserId);
  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    if (!currentUserId) return;
    toggleFollow.mutate({
      followerId: currentUserId,
      followingId: user.id,
      isFollowing: followData?.isFollowing || false,
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] transition-colors">
      <Link href={`/p/${user.username}`}>
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm"
            style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
          >
            {(user.full_name || user.username)?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/p/${user.username}`}
          className="text-sm font-bold hover:underline truncate block"
          style={{ color: 'var(--color-ink)' }}
        >
          {user.full_name || user.username}
        </Link>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
          @{user.username}
        </p>
        {user.headline && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {user.headline}
          </p>
        )}
        {user.location && (
          <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            <MapPin className="w-2.5 h-2.5" />
            {user.location}
          </p>
        )}
      </div>

      <button
        onClick={handleFollow}
        disabled={toggleFollow.isPending || user.id === currentUserId}
        className="shrink-0 p-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
        style={{
          backgroundColor: followData?.isFollowing ? 'var(--color-surface-dim)' : 'var(--color-bloom)',
          color: followData?.isFollowing ? 'var(--color-text-secondary)' : 'white',
        }}
        title={followData?.isFollowing ? 'Unfollow' : 'Follow'}
      >
        {followData?.isFollowing ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function UserDiscovery() {
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: suggestedUsers, isLoading: loadingSuggested } = useSuggestedUsers(
    currentDbUser?.id || null,
    5
  );

  const { data: searchResults, isLoading: loadingSearch } = useSearchUsers(
    searchQuery,
    currentDbUser?.id || null
  );

  const displayUsers = searchQuery.length >= 2 ? searchResults : suggestedUsers;
  const isLoading = searchQuery.length >= 2 ? loadingSearch : loadingSuggested;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/[0.06] overflow-hidden sticky top-24">
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/[0.06]">
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
          {searchQuery.length >= 2 ? 'Search Results' : 'Suggested for you'}
        </h3>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full rounded-xl bg-gray-50 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 transition-all"
            style={{ color: 'var(--color-ink)' }}
          />
        </div>
      </div>

      {/* User list */}
      <div className="px-2 pb-3">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  <div className="h-2 w-16 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayUsers && displayUsers.length > 0 ? (
          <div className="space-y-1">
            {displayUsers.map((user) => (
              <UserCard key={user.id} user={user} currentUserId={currentDbUser?.id || ''} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 px-4">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {searchQuery.length >= 2
                ? 'No users found'
                : 'Follow people to see suggestions here'}
            </p>
          </div>
        )}
      </div>

      {/* View all link */}
      {searchQuery.length < 2 && (
        <div className="px-4 py-3 border-t border-black/[0.06]">
          <Link
            href="/dashboard/network"
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--color-bloom)' }}
          >
            View all people
          </Link>
        </div>
      )}
    </div>
  );
}
