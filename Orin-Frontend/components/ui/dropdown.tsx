'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative inline-block', className)} ref={dropdownRef}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-1 z-50 min-w-[180px] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)] py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              disabled={item.disabled}
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                item.danger
                  ? 'text-[var(--color-pulse)] hover:bg-[var(--color-pulse)]/10'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)]',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
  id?: string;
}

export function Select({ value, onChange, options, placeholder, className, disabled, label, error, id }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative', className)} ref={selectRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between h-11 px-4 rounded-[var(--radius-md)] text-sm transition-all duration-200',
          'bg-[var(--color-surface)] border',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : error
            ? 'border-[var(--color-pulse)] focus:ring-2 focus:ring-[var(--color-pulse)]/20'
            : 'border-[var(--color-border)] focus:border-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-ink)]/10',
          'focus:outline-none'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn('truncate', value ? 'text-[var(--color-ink)]' : 'text-[var(--color-mist)]')}>
          {value ? options.find(o => o.value === value)?.label : placeholder}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)] max-h-60 overflow-auto"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              disabled={option.disabled}
              role="option"
              aria-selected={value === option.value}
              className={cn(
                'flex w-full items-center px-4 py-2.5 text-sm transition-colors',
                value === option.value
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-emerald)]'
                  : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-dim)]',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-pulse)' }}>{error}</p>}
    </div>
  );
}