'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSocialFeed } from '@/lib/social-posts';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import SocialPostCard from './SocialPostCard';
import CreatePostModal from './CreatePostModal';
import UserDiscovery from './UserDiscovery';
import { PenLine, RefreshCw } from 'lucide-react';

export default function SocialFeed() {
  const { user: authUser } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [page, setPage] = useState(0);

  const { data: currentDbUser } = useQuery({
    queryKey: ['current-db-user', authUser?.id],
    queryFn: async () => {
      if (!supabase || !authUser?.id) return null;
      const { data } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      return data;
    },
    enabled: !!authUser?.id,
  });

  const { data: posts, isLoading, refetch } = useSocialFeed(currentDbUser?.id || null, page);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Create post prompt */}
      <div className="mb-6 bg-white rounded-2xl ring-1 ring-black/[0.06] p-4">
        <div className="flex items-center gap-3">
          {currentDbUser?.avatar_url ? (
            <img
              src={currentDbUser.avatar_url}
              alt=""
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm"
              style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
            >
              {(currentDbUser?.full_name || currentDbUser?.username || 'U')[0]?.toUpperCase()}
            </div>
          )}
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 text-left px-4 py-3 rounded-xl text-sm transition-colors hover:bg-gray-50"
            style={{ 
              color: 'var(--color-text-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            What&apos;s on your mind?
          </button>
          <button
            onClick={() => setShowCreatePost(true)}
            className="p-3 rounded-xl transition-all duration-200 hover:bg-[var(--color-bloom)]10 active:scale-95"
            style={{ color: 'var(--color-bloom)' }}
          >
            <PenLine className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1">
          {/* Feed header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
              Your Feed
            </h2>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
            </button>
          </div>

          {/* Posts */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl ring-1 ring-black/[0.06] p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    <div className="space-y-2">
                      <div className="h-3 w-32 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                      <div className="h-2 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    <div className="h-3 w-2/3 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  </div>
                  <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                    <div className="h-8 w-16 rounded-lg" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  index={i}
                  onRefresh={() => refetch()}
                />
              ))}

              {/* Load more */}
              {posts.length >= 20 && (
                <div className="text-center py-4">
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50"
                    style={{ 
                      color: 'var(--color-bloom)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    Load more
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl ring-1 ring-black/[0.06]">
              <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)10' }}>
                <PenLine className="w-9 h-9" style={{ color: 'var(--color-bloom)' }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                Your feed is empty
              </h2>
              <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                Follow people to see their posts here. Share your thoughts and achievements with your network.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-5 justify-center">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)', color: 'white' }}
                >
                  <PenLine className="w-4 h-4" />
                  Create your first post
                </button>
                <Link
                  href="/dashboard/network"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
                  style={{ 
                    color: 'var(--color-bloom)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  Find people to follow
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - User discovery (hidden on mobile) */}
        <div className="hidden lg:block w-80 shrink-0">
          <UserDiscovery />
        </div>
      </div>

      {/* Create post modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </div>
  );
}
