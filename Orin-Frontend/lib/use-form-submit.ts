import { useState, useCallback, useRef } from 'react';

export function useFormSubmit<T extends (...args: any[]) => Promise<any>>(
  submitFn: T
): [T, boolean] {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const guardRef = useRef(false);

  const wrappedSubmit = useCallback(
    async (...args: Parameters<T>) => {
      if (guardRef.current) return;
      guardRef.current = true;
      setIsSubmitting(true);
      try {
        return await submitFn(...args);
      } finally {
        guardRef.current = false;
        setIsSubmitting(false);
      }
    },
    [submitFn]
  ) as T;

  return [wrappedSubmit, isSubmitting];
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