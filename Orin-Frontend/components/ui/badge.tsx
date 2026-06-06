'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold',
  {
    variants: {
      variant: {
        spark: 'badge-spark',
        pulse: 'badge-pulse',
        bloom: 'badge-bloom',
        ember: 'badge-ember',
        ink: 'badge-ink',
        default: 'bg-[var(--color-surface-dim)] text-[var(--color-text-secondary)]',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 rounded-[var(--radius-sm)]',
        md: 'text-[11px] px-2.5 py-0.5 rounded-[var(--radius-md)]',
        lg: 'text-xs px-3 py-1 rounded-[var(--radius-lg)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';