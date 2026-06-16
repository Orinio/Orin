'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Reply, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  usePostComments,
  useAddPostComment,
  useDeletePostComment,
  useToggleCommentReaction,
  type PostComment,
} from '@/lib/social-posts';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatRelativeTime } from '@/lib/utils';

interface PostCommentsProps {
  postId: string;
  postUserId: string;
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  depth = 0,
}: {
  comment: PostComment;
  postId: string;
  currentUserId: string;
  depth?: number;
}) {
  const addComment = useAddPostComment();
  const deleteComment = useDeletePostComment();
  const toggleReaction = useToggleCommentReaction();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = comment.user_id === currentUserId;
  const maxDepth = 3;

  const handleReply = () => {
    if (!replyText.trim()) return;
    addComment.mutate({
      postId,
      userId: currentUserId,
      content: replyText.trim(),
      parentId: comment.id,
      replyToUserId: comment.user_id,
    });
    setReplyText('');
    setShowReply(false);
  };

  const handleDelete = () => {
    deleteComment.mutate({ commentId: comment.id, postId });
    setShowMenu(false);
  };

  const handleLike = () => {
    toggleReaction.mutate({
      commentId: comment.id,
      userId: currentUserId,
      reactionType: 'like',
      hasReacted: comment.has_liked || false,
    });
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-3'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/p/${comment.users?.username}`} className="shrink-0">
          {comment.users?.avatar_url ? (
            <img
              src={comment.users.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: 'var(--color-bloom)10', color: 'var(--color-bloom)' }}
            >
              {(comment.users?.full_name || comment.users?.username)?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/p/${comment.users?.username}`}
                className="text-sm font-bold hover:underline"
                style={{ color: 'var(--color-ink)' }}
              >
                {comment.users?.full_name || comment.users?.username}
              </Link>
              {comment.reply_to_user && (
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  replied to @{comment.reply_to_user.username}
                </span>
              )}
            </div>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1.5 px-2">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-red-500"
              style={{
                color: comment.has_liked ? 'var(--color-pulse)' : 'var(--color-text-tertiary)',
              }}
            >
              <Heart className={`w-3.5 h-3.5 ${comment.has_liked ? 'fill-current' : ''}`} />
              {comment.like_count > 0 && comment.like_count}
            </button>
            {depth < maxDepth && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-blue-500"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
            <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatRelativeTime(comment.created_at)}
            </span>

            {/* Menu */}
            {isOwner && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-lg hover:bg-black/[0.04] transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg ring-1 ring-black/10 overflow-hidden z-10"
                    >
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReply && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    placeholder="Write a reply..."
                    className="flex-1 rounded-xl bg-white px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 transition-all"
                    style={{ color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}
                    autoFocus
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || addComment.isPending}
                    className="rounded-xl px-3 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95"
                    style={{
                      background: replyText.trim()
                        ? 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)'
                        : 'var(--color-surface-dim)',
                    }}
                  >
                    Reply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostComments({ postId }: PostCommentsProps) {
  const { user: authUser } = useAuth();
  const addComment = useAddPostComment();
  const [commentText, setCommentText] = useState('');

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

  const { data: comments, isLoading } = usePostComments(postId, currentDbUser?.id || null);

  const handleSubmit = () => {
    if (!commentText.trim() || !currentDbUser?.id) return;
    addComment.mutate({
      postId,
      userId: currentDbUser.id,
      content: commentText.trim(),
    });
    setCommentText('');
  };

  return (
    <div className="px-5 py-4">
      {/* Comment input */}
      {currentDbUser && (
        <div className="flex gap-3 mb-4">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ backgroundColor: 'var(--color-bloom)10', color: 'var(--color-bloom)' }}
          >
            U
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Write a comment..."
              className="flex-1 rounded-xl bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-bloom)]/20 transition-all"
              style={{ color: 'var(--color-ink)' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!commentText.trim() || addComment.isPending}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-95"
              style={{
                background: commentText.trim()
                  ? 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)'
                  : 'var(--color-surface-dim)',
              }}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
                <div className="h-10 rounded-xl" style={{ backgroundColor: 'var(--color-surface-dim)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentDbUser?.id || ''}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}
    </div>
  );
}
