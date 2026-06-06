'use client';

import { useState, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({ tabs, value, onChange, className, variant = 'default' }: TabsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'flex gap-1',
          variant === 'pills' && 'bg-[var(--color-surface-dim)] p-1 rounded-[var(--radius-lg)]',
          variant === 'underline' && 'border-b border-[var(--color-border)]'
        )}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={value === tab.value}
            aria-controls={`panel-${tab.value}`}
            id={`tab-${tab.value}`}
            onClick={() => !tab.disabled && onChange(tab.value)}
            disabled={tab.disabled}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200',
              'rounded-[var(--radius-md)]',
              variant === 'default' &&
                (value === tab.value
                  ? 'bg-[var(--color-primary-emerald)] text-white shadow-[var(--shadow-colored-bloom)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)]'),
              variant === 'pills' &&
                (value === tab.value
                  ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-ink)]'),
              variant === 'underline' &&
                (value === tab.value
                  ? 'text-[var(--color-primary-emerald)] border-b-2 border-[var(--color-primary-emerald)] -mb-px'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-ink)] border-b-2 border-transparent -mb-px'),
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TabPanelsProps {
  tabs: TabItem[];
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanels({ tabs, value, children, className }: TabPanelsProps) {
  return (
    <div className={cn('space-y-4', className)} role="tabpanel" aria-labelledby={`tab-${value}`}>
      {tabs.map((tab) => (
        <div
          key={tab.value}
          id={`panel-${tab.value}`}
          role="tabpanel"
          hidden={value !== tab.value}
          className={cn(
            'animate-fadeIn',
            value !== tab.value && 'hidden'
          )}
        >
          {typeof children === 'function' ? children(tab.value) : children}
        </div>
      ))}
    </div>
  );
}