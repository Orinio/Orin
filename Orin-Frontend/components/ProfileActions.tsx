'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useFollowStatus, useToggleFollow, useStartConversation } from '@/lib/social';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { UserPlus, UserCheck, MessageCircle, ExternalLink } from 'lucide-react';

interface ProfileActionsProps {
  profileUserId: string;
  username: string;
}

export default function ProfileActions({ profileUserId, username }: ProfileActionsProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const startConvo = useStartConversation();
  const toggleFollow = useToggleFollow();

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

  const { data: followData } = useFollowStatus(
    currentDbUser?.id ? profileUserId : null,
    currentDbUser?.id || null
  );

  const isOwnProfile = currentDbUser?.id === profileUserId;

  const handleFollow = () => {
    if (!currentDbUser?.id) return;
    toggleFollow.mutate({
      followerId: currentDbUser.id,
      followingId: profileUserId,
      isFollowing: followData?.isFollowing || false,
    });
  };

  const handleMessage = async () => {
    if (!currentDbUser?.id) return;
    const convId = await startConvo.mutateAsync({
      senderId: currentDbUser.id,
      receiverId: profileUserId,
    });
    router.push(`/dashboard/messages?conv=${convId}`);
  };

  if (!authUser || isOwnProfile) return null;

  return (
    <div className="flex items-center gap-3 mt-6">
      <button
        onClick={handleFollow}
        disabled={toggleFollow.isPending}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
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
            <UserCheck className="w-4 h-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Follow
          </>
        )}
      </button>

      <button
        onClick={handleMessage}
        disabled={startConvo.isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.97]"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <MessageCircle className="w-4 h-4" />
        Message
      </button>

      <div className="flex items-center gap-4 ml-auto text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
          {followData?.followerCount || 0}
        </span>
        followers
        <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>
          {followData?.followingCount || 0}
        </span>
        following
      </div>
    </div>
  );
}
