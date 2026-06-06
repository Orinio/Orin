'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-[var(--color-border)] rounded',
          variant === 'text' && 'h-4',
          variant === 'circular' && 'rounded-full',
          variant === 'rectangular' && 'rounded-[var(--radius-md)]',
          className
        )}
        style={{ width, height, minWidth: width, minHeight: height }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="30%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width="80px" />
      </div>
    </div>
  );
}