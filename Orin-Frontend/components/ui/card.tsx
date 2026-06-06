'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  variant?: 'default' | 'premium' | 'accent-ember' | 'accent-pulse' | 'accent-bloom' | 'accent-spark';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hover = true, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-xl)] p-6 transition-all duration-200',
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          variant === 'default' && 'shadow-[var(--shadow-sm)]',
          variant === 'premium' && 'shadow-[var(--shadow-md)] rounded-[var(--radius-2xl)]',
          variant === 'accent-ember' && 'border-l-4 border-[var(--color-ember)]',
          variant === 'accent-pulse' && 'border-l-4 border-[var(--color-pulse)]',
          variant === 'accent-bloom' && 'border-l-4 border-[var(--color-bloom)]',
          variant === 'accent-spark' && 'border-l-4 border-[var(--color-spark)]',
          hover && variant === 'default' && 'hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
          hover && variant === 'premium' && 'hover:shadow-[var(--shadow-xl)] hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mb-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('mt-4 pt-4 border-t border-[var(--color-border)]', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';