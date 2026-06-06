'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-spark)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-pulse)] text-white hover:bg-[var(--color-pulse)]/90 shadow-[var(--shadow-colored-pulse)] hover:shadow-[var(--shadow-glow-pulse),var(--shadow-colored-pulse)] hover:-translate-y-0.5',
        secondary: 'bg-[var(--color-ember)] text-white hover:bg-[var(--color-ember)]/90 shadow-[var(--shadow-colored-ember)] hover:shadow-[var(--shadow-glow-ember),var(--shadow-colored-ember)] hover:-translate-y-0.5',
        success: 'bg-[var(--color-bloom)] text-white hover:bg-[var(--color-bloom)]/90 shadow-[var(--shadow-colored-bloom)] hover:shadow-[var(--shadow-glow-bloom),var(--shadow-colored-bloom)] hover:-translate-y-0.5',
        outline: 'border-2 border-[var(--color-border-strong)] bg-transparent hover:bg-[var(--color-ink)] hover:text-white hover:border-[var(--color-ink)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
        ghost: 'bg-transparent hover:bg-[var(--color-surface-dim)]',
        danger: 'bg-[var(--color-pulse)] text-white hover:bg-[var(--color-pulse)]/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          icon
        )}
        <span className={cn(loading && 'sr-only')}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';