import { memo } from 'react';

function ProofCardSkeletonInner() {
  return (
    <div className="card-base p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--color-surface-dim)]" />
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-[var(--color-surface-dim)]" />
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded bg-[var(--color-surface-dim)]" />
              <div className="h-4 w-14 rounded bg-[var(--color-surface-dim)]" />
            </div>
          </div>
          <div className="h-3 w-full rounded bg-[var(--color-surface-dim)]" />
          <div className="h-3 w-2/3 rounded bg-[var(--color-surface-dim)]" />
          <div className="flex gap-1">
            <div className="h-5 w-12 rounded bg-[var(--color-surface-dim)]" />
            <div className="h-5 w-14 rounded bg-[var(--color-surface-dim)]" />
            <div className="h-5 w-10 rounded bg-[var(--color-surface-dim)]" />
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex gap-3">
        <div className="h-3 w-8 rounded bg-[var(--color-surface-dim)]" />
        <div className="h-3 w-8 rounded bg-[var(--color-surface-dim)]" />
        <div className="h-3 w-8 rounded bg-[var(--color-surface-dim)]" />
      </div>
    </div>
  );
}

export const ProofCardSkeleton = memo(ProofCardSkeletonInner);
export default ProofCardSkeleton;
