'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolved] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: Theme) => {
    const resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    setResolved(resolved);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('orin.theme', t);
    applyTheme(t);
  };

  useEffect(() => {
    const stored = localStorage.getItem('orin.theme') as Theme | null;
    const initial = stored || 'system';
    setThemeState(initial);
    applyTheme(initial);
    setMounted(true);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const storedTheme = localStorage.getItem('orin.theme') as Theme | null;
      if (!storedTheme || storedTheme === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
