import { useRef, useCallback } from 'react';

export function useFormSubmit<T extends (...args: any[]) => Promise<any>>(
  submitFn: T
): [T, boolean] {
  const isSubmitting = useRef(false);

  const wrappedSubmit = useCallback(
    async (...args: Parameters<T>) => {
      if (isSubmitting.current) return;
      isSubmitting.current = true;
      try {
        return await submitFn(...args);
      } finally {
        isSubmitting.current = false;
      }
    },
    [submitFn]
  ) as T;

  return [wrappedSubmit, isSubmitting.current];
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}