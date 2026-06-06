'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium"
            style={{ color: 'var(--color-ink)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-3 rounded-[var(--radius-md)] text-sm transition-all duration-200 resize-none',
            'bg-[var(--color-surface)] border',
            error
              ? 'border-[var(--color-pulse)] focus:ring-2 focus:ring-[var(--color-pulse)]/20'
              : 'border-[var(--color-border)] focus:border-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-ink)]/10',
            'placeholder:text-[var(--color-mist)]',
            'focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs font-medium" style={{ color: 'var(--color-pulse)' }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';