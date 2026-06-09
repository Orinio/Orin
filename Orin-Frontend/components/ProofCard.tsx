'use client';

import Link from 'next/link';
import type { Proof, VerificationStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Clock,
  FileText,
  XCircle,
  Star,
  Eye,
  ExternalLink,
} from 'lucide-react';
import TypeBadge from './TypeBadge';
import ShareableProofCard from './ShareableProofCard';
import Image from 'next/image';
import { useLikeStatus, useToggleLike, useComments, useAddComment } from '@/lib/social';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface ProofCardProps {
  proof: Proof;
  variant?: 'dashboard' | 'public';
}

const statusConfig: Record<
  VerificationStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  verified: {
    label: 'Verified',
    className: 'badge-bloom',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  pending: {
    label: 'Pending',
    className: 'badge-ember',
    icon: <Clock className="w-3 h-3" />,
  },
  draft: {
    label: 'Draft',
    className: 'badge-ink',
    icon: <FileText className="w-3 h-3" />,
  },
  rejected: {
    label: 'Rejected',
    className: 'badge-pulse',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function ProofCard({ proof, variant = 'dashboard' }: ProofCardProps) {
  const {
    id,
    title,
    sourceType,
    verificationStatus,
    skillsExtracted,
    description,
    viewCount = 0,
    whatItProves,
    thumbnailUrl,
    isHighlighted,
  } = proof;

  const { user: authUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
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

  const { data: likeData } = useLikeStatus(id, currentDbUser?.id || null);
  const toggleLike = useToggleLike();
  const { data: comments } = useComments(id);
  const addComment = useAddComment();

  const handleLike = () => {
    if (!currentDbUser?.id) return;
    toggleLike.mutate({ userId: currentDbUser.id, proofCardId: id, hasLiked: likeData?.hasLiked || false });
  };

  const handleComment = () => {
    if (!currentDbUser?.id || !commentText.trim()) return;
    addComment.mutate({ userId: currentDbUser.id, proofCardId: id, content: commentText.trim() });
    setCommentText('');
  };

  const status = statusConfig[verificationStatus];

  return (
    <div
      className={cn(
        'group relative card-base p-5 hover-lift transition-all duration-300',
        isHighlighted && 'card-accent-bloom',
      )}
    >
      {isHighlighted && (
        <div className="absolute top-3 right-3">
          <span className="badge-spark inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            <Star className="w-2.5 h-2.5 fill-current" />
            Highlighted
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        {thumbnailUrl && (
          <div className="relative w-16 h-16 rounded-[var(--radius-lg)] overflow-hidden flex-shrink-0 bg-[var(--color-surface-dim)]">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-snug truncate" style={{ color: 'var(--color-ink)' }}>
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <TypeBadge type={sourceType} />
                <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold', status.className)}>
                  {status.icon}
                  {status.label}
                </span>
              </div>
            </div>
          </div>

          {description && (
            <p
              className="text-xs leading-relaxed mt-2 line-clamp-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {description}
            </p>
          )}

          {whatItProves.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Proves
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'var(--color-bg-ember-light)', color: 'var(--color-ember)' }}>
                {whatItProves.length}
              </span>
            </div>
          )}

          {skillsExtracted.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {skillsExtracted.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="badge-ink text-[11px] font-medium px-2 py-0.5"
                >
                  {skill}
                </span>
              ))}
              {skillsExtracted.length > 4 && (
                <span
                  className="text-[11px] font-medium px-2 py-0.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  +{skillsExtracted.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <Eye className="w-3 h-3" />
              {viewCount}
            </span>
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className="flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: likeData?.hasLiked ? 'var(--color-pulse)' : 'var(--color-text-tertiary)' }}
            >
              {likeData?.hasLiked ? '❤️' : '🤍'} {likeData?.likeCount || 0}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: showComments ? 'var(--color-bloom)' : 'var(--color-text-tertiary)' }}
            >
              💬 {comments?.length || 0}
            </button>
            {proof.sourceUrl && (
              <a
                href={proof.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] transition-colors hover:opacity-80"
                style={{ color: 'var(--color-pulse)' }}
                aria-label="Open source URL"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <ShareableProofCard proof={proof} />
              <Link
                href={`/dashboard/proof/${id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-md)] transition-all duration-200 hover:bg-[var(--color-surface-dim)]"
                style={{ color: 'var(--color-pulse)' }}
              >
                {variant === 'dashboard' ? 'View Details' : 'View Full Proof'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          {comments && comments.length > 0 && (
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                    {(comment.users?.full_name || comment.users?.username)?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                        {comment.users?.full_name || comment.users?.username}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border bg-[var(--color-surface)] px-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-[var(--color-bloom)]/30"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim() || addComment.isPending}
              className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-bloom)' }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
