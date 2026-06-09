'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useFeed, useLikeStatus, useToggleLike, useComments, useAddComment } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';

function FeedPostCard({ post, currentUserId }: { post: any; currentUserId: string }) {
  const { data: likeData } = useLikeStatus(post.id, currentUserId);
  const toggleLike = useToggleLike();
  const { data: comments } = useComments(post.id);
  const addComment = useAddComment();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    if (!currentUserId) return;
    toggleLike.mutate({ userId: currentUserId, proofCardId: post.id, hasLiked: likeData?.hasLiked || false });
  };

  const handleComment = () => {
    if (!currentUserId || !commentText.trim()) return;
    addComment.mutate({ userId: currentUserId, proofCardId: post.id, content: commentText.trim() });
    setCommentText('');
  };

  const verificationColors: Record<string, string> = {
    verified: 'var(--color-bloom)',
    pending: 'var(--color-ember)',
    draft: 'var(--color-text-tertiary)',
    rejected: 'var(--color-pulse)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium overflow-hidden"
    >
      {/* Author header */}
      <div className="p-5 pb-0">
        <div className="flex items-center gap-3">
          <Link href={`/p/${post.users?.username}`}>
            {post.users?.avatar_url ? (
              <img src={post.users.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                {(post.users?.full_name || post.users?.username)?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/p/${post.users?.username}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-ink)' }}>
              {post.users?.full_name || post.users?.username}
            </Link>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <span>@{post.users?.username}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white capitalize" style={{ backgroundColor: verificationColors[post.verification_status] || 'var(--color-text-tertiary)' }}>
            {post.verification_status}
          </span>
        </div>
      </div>

      {/* Post content */}
      <div className="px-5 py-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
          {post.title}
        </h3>
        {post.description && (
          <p className="text-sm mt-2 line-clamp-4" style={{ color: 'var(--color-text-secondary)' }}>
            {post.description}
          </p>
        )}
        {post.skills && post.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.skills.map((skill: string) => (
              <span key={skill} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                {skill}
              </span>
            ))}
          </div>
        )}
        {post.source_url && (
          <a href={post.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-3 hover:underline" style={{ color: 'var(--color-bloom)' }}>
            🔗 View source
          </a>
        )}
      </div>

      {/* Like / Comment bar */}
      <div className="px-5 py-3 flex items-center gap-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleLike}
          disabled={toggleLike.isPending}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: likeData?.hasLiked ? 'var(--color-pulse)' : 'var(--color-text-tertiary)' }}
        >
          <span className="text-lg">{likeData?.hasLiked ? '❤️' : '🤍'}</span>
          {likeData?.likeCount || 0}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: showComments ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }}
        >
          <span className="text-lg">💬</span>
          {comments?.length || 0}
        </button>
        <Link href={`/dashboard/proof/${post.id}`} className="flex items-center gap-1.5 text-sm font-medium ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          View →
        </Link>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
          {/* Existing comments */}
          {comments && comments.length > 0 && (
            <div className="px-5 py-3 space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                    {(comment.users?.full_name || comment.users?.username)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {comment.users?.full_name || comment.users?.username}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div className="px-5 py-3 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-bloom)]/30"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FeedPage() {
  const { user: authUser } = useAuth();

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

  const { data: posts, isLoading } = useFeed(currentDbUser?.id || null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-ink)' }}>
            Feed
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            Proof cards from people you follow.
          </p>
        </div>
        <Link
          href="/dashboard/network"
          className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
        >
          🔍 Find people
        </Link>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  <div className="h-2 w-16 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="h-3 w-2/3 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} currentUserId={currentDbUser?.id || ''} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="text-5xl">📭</span>
          <h2 className="text-xl font-semibold mt-4" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
            Your feed is empty
          </h2>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            Follow people to see their proof cards here. Their verified work and achievements will appear in your feed.
          </p>
          <Link
            href="/dashboard/network"
            className="btn-primary inline-flex items-center gap-2 mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            🔍 Find people to follow
          </Link>
        </div>
      )}
    </div>
  );
}
