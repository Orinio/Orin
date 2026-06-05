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
import Image from 'next/image';

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

          <div
            className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                <Eye className="w-3 h-3" />
                {viewCount}
              </span>
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
            </div>

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
  );
}
