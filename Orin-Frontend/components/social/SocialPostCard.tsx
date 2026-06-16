'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share2,
  MoreHorizontal,
  Globe,
  Users,
  Lock,
  Trash2,
  Pencil,
  Flag,
} from 'lucide-react';
import { useToggleReaction, useToggleBookmark, useDeletePost, type SocialPost } from '@/lib/social-posts';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';
import PostComments from './PostComments';

interface SocialPostCardProps {
  post: SocialPost;
  index?: number;
  onRefresh?: () => void;
}

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'funny', emoji: '😄', label: 'Funny' },
];

const VISIBILITY_ICONS = {
  public: Globe,
  followers: Users,
  private: Lock,
};

export default function SocialPostCard({ post, index = 0, onRefresh }: SocialPostCardProps) {
  const { user: authUser } = useAuth();
  const toggleReaction = useToggleReaction();
  const toggleBookmark = useToggleBookmark();
  const deletePost = useDeletePost();
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const isOwner = currentDbUser?.id === post.user_id;
  const VisIcon = VISIBILITY_ICONS[post.visibility] || Globe;
  const shouldTruncate = post.content.length > 280;
  const displayContent = shouldTruncate && !isExpanded
    ? post.content.slice(0, 280) + '...'
    : post.content;

  const handleReaction = (reactionType: string) => {
    if (!currentDbUser?.id) return;
    const hasReacted = (post.user_reactions || []).includes(reactionType);
    toggleReaction.mutate({
      postId: post.id,
      userId: currentDbUser.id,
      reactionType,
      hasReacted,
    });
    setShowReactions(false);
  };

  const handleBookmark = () => {
    if (!currentDbUser?.id) return;
    toggleBookmark.mutate({
      postId: post.id,
      userId: currentDbUser.id,
      isBookmarked: post.has_bookmarked || false,
    });
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    await deletePost.mutateAsync(post.id);
    setShowMenu(false);
    onRefresh?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.users?.full_name || post.users?.username}`,
          text: post.content.slice(0, 200),
          url: `${window.location.origin}/post/${post.id}`,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-2xl ring-1 ring-black/[0.06] overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/p/${post.users?.username}`}>
              {post.users?.avatar_url ? (
                <img
                  src={post.users.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: 'var(--color-bloom)15', color: 'var(--color-bloom)' }}
                >
                  {(post.users?.full_name || post.users?.username)?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/p/${post.users?.username}`}
                  className="text-sm font-bold hover:underline"
                  style={{ color: 'var(--color-ink)' }}
                >
                  {post.users?.full_name || post.users?.username}
                </Link>
                <VisIcon className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
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

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black/10 overflow-hidden z-10"
                >
                  {isOwner ? (
                    <>
                      <button
                        onClick={() => setShowMenu(false)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit post
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Report post
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-ink)' }}>
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 text-sm font-semibold hover:underline"
            style={{ color: 'var(--color-bloom)' }}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-sm font-semibold hover:underline cursor-pointer"
                style={{ color: 'var(--color-bloom)' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Repost indicator */}
        {post.post_type === 'repost' && post.repost_of && (
          <div className="mt-3 p-3 rounded-xl bg-gray-50 ring-1 ring-black/[0.06]">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-tertiary)' }}>
              Reposted from @{post.repost_of.users?.username}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {(post.like_count > 0 || post.comment_count > 0 || post.repost_count > 0) && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {post.like_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-[8px]">👍</span>
                  {post.like_count > 1 && (
                    <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px]">❤️</span>
                  )}
                </span>
                {post.like_count}
              </span>
            )}
            {post.comment_count > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
              </button>
            )}
            {post.repost_count > 0 && (
              <span>{post.repost_count} repost{post.repost_count !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="px-5 py-3 flex items-center gap-1 border-t border-black/[0.06]">
        {/* Like with reaction picker */}
        <div
          className="relative"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            onClick={() => handleReaction('like')}
            disabled={toggleReaction.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-red-50 active:scale-95"
            style={{
              color: (post.user_reactions || []).includes('like')
                ? 'var(--color-pulse)'
                : 'var(--color-text-tertiary)',
            }}
          >
            <Heart
              className={`w-[18px] h-[18px] transition-transform ${
                (post.user_reactions || []).includes('like') ? 'fill-current scale-110' : ''
              }`}
            />
            {post.like_count || ''}
          </button>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 mb-2 flex items-center gap-1 p-2 bg-white rounded-full shadow-lg ring-1 ring-black/10"
              >
                {REACTION_TYPES.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all hover:scale-125 active:scale-95"
                    title={reaction.label}
                  >
                    <span className="text-xl">{reaction.emoji}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comment */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-blue-50 active:scale-95"
          style={{
            color: showComments ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
          }}
        >
          <MessageCircle className={`w-[18px] h-[18px] ${showComments ? 'fill-current' : ''}`} />
          {post.comment_count || ''}
        </button>

        {/* Repost */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-green-50 active:scale-95"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Repeat2 className="w-[18px] h-[18px]" />
          {post.repost_count || ''}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-purple-50 active:scale-95"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Share2 className="w-[18px] h-[18px]" />
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={toggleBookmark.isPending}
          className="ml-auto p-2 rounded-xl transition-all duration-200 hover:bg-yellow-50 active:scale-95"
          style={{
            color: post.has_bookmarked ? '#EAB308' : 'var(--color-text-tertiary)',
          }}
        >
          <Bookmark className={`w-[18px] h-[18px] ${post.has_bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black/[0.06] overflow-hidden"
          >
            <PostComments postId={post.id} postUserId={post.user_id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
