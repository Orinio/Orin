'use client';

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      theme="light"
      className="toaster-group"
      toastOptions={{
        classNames: {
          toast: 'rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]',
          description: 'text-sm',
          actionButton: 'rounded-[var(--radius-md)] bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink)]/90',
          cancelButton: 'rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-dim)]',
        },
      }}
    />
  );
}

export interface ToastOptions {
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, {
      icon: '✓',
      ...options,
    }),

  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, {
      icon: '✕',
      ...options,
    }),

  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, {
      icon: 'ℹ',
      ...options,
    }),

  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, {
      icon: '⚠',
      ...options,
    }),

  loading: (message: string, options?: ToastOptions) =>
    sonnerToast.loading(message, {
      ...options,
    }),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) =>
    sonnerToast.promise(promise, { ...messages, ...options }),

  custom: (component: React.ReactNode, options?: ToastOptions) =>
    sonnerToast.custom(component, options),

  dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
};