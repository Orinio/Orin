'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useFeed, useLikeStatus, useToggleLike, useComments, useAddComment } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';
import { Heart, MessageCircle, Share2, ExternalLink, Bookmark, MoreHorizontal, Verified } from 'lucide-react';

function FeedPostCard({ post, currentUserId, index }: { post: any; currentUserId: string; index: number }) {
  const { data: likeData } = useLikeStatus(post.id, currentUserId);
  const toggleLike = useToggleLike();
  const { data: comments } = useComments(post.id);
  const addComment = useAddComment();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

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

  const sourceTypeIcons: Record<string, string> = {
    github: 'GitHub',
    kaggle: 'Kaggle',
    certificate: 'Certificate',
    hackathon: 'Hackathon',
    project: 'Project',
    blog: 'Blog',
    demo: 'Demo',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="card-premium overflow-hidden"
    >
      {/* Author header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/p/${post.users?.username}`}>
              {post.users?.avatar_url ? (
                <img src={post.users.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm" />
              ) : (
                <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm" style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}>
                  {(post.users?.full_name || post.users?.username)?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link href={`/p/${post.users?.username}`} className="text-sm font-bold hover:underline" style={{ color: 'var(--color-ink)' }}>
                  {post.users?.full_name || post.users?.username}
                </Link>
                <Verified className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} />
              </div>
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>@{post.users?.username}</span>
                <span>·</span>
                <span>{formatRelativeTime(post.created_at)}</span>
                {post.users?.headline && (
                  <>
                    <span>·</span>
                    <span className="truncate max-w-[150px]">{post.users.headline}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] transition-colors">
            <MoreHorizontal className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
        </div>
      </div>

      {/* Post content */}
      <div className="px-5 py-4">
        <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
          {post.title}
        </h3>
        {post.description && (
          <p className="text-sm mt-2 leading-relaxed line-clamp-4" style={{ color: 'var(--color-text-secondary)' }}>
            {post.description}
          </p>
        )}

        {/* Source type badge */}
        <div className="flex items-center gap-2 mt-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
          >
            {sourceTypeIcons[post.source_type] || post.source_type}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: verificationColors[post.verification_status] || 'var(--color-text-tertiary)' }}
          >
            {post.verification_status === 'verified' && '✓ '}
            {post.verification_status}
          </span>
        </div>

        {/* Skills */}
        {post.skills_extracted && post.skills_extracted.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(showAllSkills ? post.skills_extracted : post.skills_extracted.slice(0, 5)).map((skill: string) => (
              <span key={skill} className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: 'var(--color-bloom)08', color: 'var(--color-bloom)' }}>
                {skill}
              </span>
            ))}
            {!showAllSkills && post.skills_extracted.length > 5 && (
              <button
                onClick={() => setShowAllSkills(true)}
                className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold hover:bg-[var(--color-surface-dim)] transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                +{post.skills_extracted.length - 5} more
              </button>
            )}
          </div>
        )}

        {/* Source link */}
        {post.source_url && (
          <a
            href={post.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs mt-3 font-medium hover:underline"
            style={{ color: 'var(--color-bloom)' }}
          >
            <ExternalLink className="w-3 h-3" />
            View source
          </a>
        )}
      </div>

      {/* Action bar */}
      <div className="px-5 py-3 flex items-center gap-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={handleLike}
          disabled={toggleLike.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--color-pulse)]08 active:scale-95"
          style={{ color: likeData?.hasLiked ? 'var(--color-pulse)' : 'var(--color-text-tertiary)' }}
        >
          <Heart className={`w-[18px] h-[18px] transition-transform ${likeData?.hasLiked ? 'fill-current scale-110' : ''}`} />
          {likeData?.likeCount || 0}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--color-bloom)]08 active:scale-95"
          style={{ color: showComments ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }}
        >
          <MessageCircle className={`w-[18px] h-[18px] ${showComments ? 'fill-current' : ''}`} />
          {comments?.length || 0}
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--color-surface-dim)] active:scale-95"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Share2 className="w-[18px] h-[18px]" />
          Share
        </button>
        <button
          className="ml-auto p-2 rounded-xl transition-all duration-200 hover:bg-[var(--color-surface-dim)] active:scale-95"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Bookmark className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="border-t overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {comments && comments.length > 0 && (
            <div className="px-5 py-3 space-y-3 max-h-72 overflow-y-auto">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: 'var(--color-bloom)10', color: 'var(--color-bloom)' }}>
                    {(comment.users?.full_name || comment.users?.username)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
                        {comment.users?.full_name || comment.users?.username}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
              className="flex-1 rounded-xl bg-[var(--color-surface-dim)] px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 transition-all"
              style={{ color: 'var(--color-ink)' }}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95"
              style={{ background: commentText.trim() ? 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)' : 'var(--color-surface-dim)' }}
            >
              Post
            </button>
          </div>
        </motion.div>
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
    <div className="max-w-2xl mx-auto space-y-6">
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
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-[0.97]"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          Find people
        </Link>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="space-y-2">
                  <div className="h-3 w-28 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                  <div className="h-2 w-20 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
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
            <FeedPostCard key={post.id} post={post} currentUserId={currentDbUser?.id || ''} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card-premium">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-bloom)10' }}>
            <span className="text-4xl">📭</span>
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
            Your feed is empty
          </h2>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
            Follow people to see their proof cards here. Their verified work and achievements will appear in your feed.
          </p>
          <Link
            href="/dashboard/network"
            className="inline-flex items-center gap-2 mt-5 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)', color: 'white' }}
          >
            Find people to follow
          </Link>
        </div>
      )}
    </div>
  );
}
