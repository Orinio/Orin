'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUserSearch, useFollowStatus, useToggleFollow, useStartConversation } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Search, MessageCircle, UserPlus, UserCheck, MapPin, Briefcase, Sparkles, Verified, TrendingUp } from 'lucide-react';

function UserCard({ user, currentUserId, index }: { user: any; currentUserId: string; index: number }) {
  const router = useRouter();
  const { data: followData } = useFollowStatus(user.id, currentUserId);
  const toggleFollow = useToggleFollow();
  const startConvo = useStartConversation();

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
    router.push(`/dashboard/messages?conv=${convId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group card-premium p-5 hover-lift transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link href={`/p/${user.username}`} className="shrink-0 relative">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || user.username} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
          ) : (
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold ring-2 ring-white shadow-sm" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
              {(user.full_name || user.username)?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--color-bloom)' }} />
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/p/${user.username}`} className="block group/link">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold truncate group-hover/link:underline" style={{ color: 'var(--color-ink)' }}>
                {user.full_name || user.username}
              </h3>
              <Verified className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
            </div>
          </Link>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>@{user.username}</p>
          {user.headline && (
            <p className="text-xs mt-1 line-clamp-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {user.headline}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {user.location && (
              <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                <MapPin className="w-3 h-3" />
                {user.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 hover:shadow-md active:scale-[0.97]"
              style={{
                background: followData?.isFollowing
                  ? 'var(--color-surface-dim)'
                  : 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)',
                color: followData?.isFollowing ? 'var(--color-text-secondary)' : 'white',
                border: followData?.isFollowing ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {followData?.isFollowing ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </>
              )}
            </button>
            <button
              onClick={handleMessage}
              className="p-2 rounded-xl transition-all duration-200 hover:bg-[var(--color-surface-dim)] active:scale-95"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
          {followData && (
            <div className="text-[10px] text-right" style={{ color: 'var(--color-text-tertiary)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{followData.followerCount}</span> followers
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SuggestedUsers({ currentUserId }: { currentUserId: string }) {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggested-users', currentUserId],
    queryFn: async () => {
      if (!supabase || !currentUserId) return [];
      const { data } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, headline, location')
        .eq('is_profile_public', true)
        .eq('account_status', 'active')
        .is('deleted_at', null)
        .neq('id', currentUserId)
        .limit(5);
      return data || [];
    },
    enabled: !!currentUserId,
  });

  if (isLoading || !suggestions?.length) return null;

  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Suggested for you</h3>
      </div>
      <div className="space-y-3">
        {suggestions.map((user: any) => (
          <UserCard key={user.id} user={user} currentUserId={currentUserId} index={0} />
        ))}
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useUserSearch(searchQuery);

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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, username, or role..."
          className="w-full rounded-2xl bg-[var(--color-surface)] pl-12 pr-4 py-4 text-sm transition-all placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 focus:shadow-lg"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
        />
      </div>

      {/* Results */}
      {searchQuery.length < 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="text-center py-16 card-premium">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)10' }}>
                <Sparkles className="w-9 h-9" style={{ color: 'var(--color-bloom)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                Find your network
              </h2>
              <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                Search for colleagues, classmates, or professionals in your field.
                Follow them to see their proof cards in your feed.
              </p>
            </div>
          </div>

          {/* Sidebar - Suggested */}
          <div className="lg:col-span-1">
            {currentDbUser?.id && <SuggestedUsers currentUserId={currentDbUser.id} />}
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-premium p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  <div className="h-3 w-48 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users && users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user, i) => (
            <UserCard key={user.id} user={user} currentUserId={currentDbUser?.id || ''} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-premium">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
            <Search className="w-7 h-7" style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>No results found</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
