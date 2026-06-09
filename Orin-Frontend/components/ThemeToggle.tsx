'use client';

import { useTheme } from '@/lib/theme-provider';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setTheme('light')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
          resolvedTheme === 'light' && theme !== 'system'
            ? 'bg-[var(--color-spark)] text-[var(--color-ink)] shadow-sm'
            : 'bg-[var(--color-surface-dim)] text-[var(--color-text-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        ☀️ Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
          resolvedTheme === 'dark' && theme !== 'system'
            ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-sm'
            : 'bg-[var(--color-surface-dim)] text-[var(--color-text-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        🌙 Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all ${
          theme === 'system'
            ? 'bg-[var(--color-bloom)] text-white shadow-sm'
            : 'bg-[var(--color-surface-dim)] text-[var(--color-text-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        💻 System
      </button>
    </div>
  );
}
