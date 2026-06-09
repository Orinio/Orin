'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  shortcut?: string[];
  action: () => void;
  category: 'navigation' | 'actions' | 'search' | 'recent';
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const NAVIGATION_ITEMS: Omit<CommandItem, 'id' | 'action'>[] = [
  { label: 'Dashboard', description: 'View your career overview', icon: '🏠', shortcut: ['G', 'D'], category: 'navigation' },
  { label: 'Feed', description: 'See proof cards from people you follow', icon: '📰', shortcut: ['G', 'F'], category: 'navigation' },
  { label: 'Proof Cards', description: 'Manage your proof portfolio', icon: '🃏', shortcut: ['G', 'P'], category: 'navigation' },
  { label: 'AI Coach', description: 'Chat with your career coach', icon: '🤖', shortcut: ['G', 'C'], category: 'navigation' },
  { label: 'Network', description: 'Find and connect with professionals', icon: '🌐', shortcut: ['G', 'N'], category: 'navigation' },
  { label: 'Messages', description: 'Direct messages from your network', icon: '💬', shortcut: ['G', 'M'], category: 'navigation' },
  { label: 'Analytics', description: 'View your profile insights', icon: '📊', shortcut: ['G', 'A'], category: 'navigation' },
  { label: 'Opportunities', description: 'Browse jobs and gigs', icon: '💼', shortcut: ['G', 'O'], category: 'navigation' },
  { label: 'Settings', description: 'Manage your account', icon: '⚙️', shortcut: ['G', 'S'], category: 'navigation' },
  { label: 'Public Profile', description: 'View your public page', icon: '👁️', shortcut: ['G', 'V'], category: 'navigation' },
];

const ACTION_ITEMS: Omit<CommandItem, 'id' | 'action'>[] = [
  { label: 'New Proof Card', description: 'Create a new proof card', icon: '✨', shortcut: ['N'], category: 'actions' },
  { label: 'Import from URL', description: 'Auto-generate proof from GitHub/Kaggle', icon: '🔗', shortcut: ['I'], category: 'actions' },
  { label: 'Start AI Chat', description: 'Ask your career coach anything', icon: '💬', shortcut: ['A'], category: 'actions' },
  { label: 'Download CV', description: 'Export your proof portfolio', icon: '📥', category: 'actions' },
  { label: 'Share Profile', description: 'Copy your profile link', icon: '🔗', category: 'actions' },
];

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems: CommandItem[] = [
    ...NAVIGATION_ITEMS.map((item, i) => ({
      ...item,
      id: `nav-${i}`,
      action: () => {
        const routes: Record<string, string> = {
          'Dashboard': '/dashboard',
          'Feed': '/dashboard/feed',
          'Proof Cards': '/dashboard/proof',
          'AI Coach': '/dashboard/ai',
          'Network': '/dashboard/network',
          'Messages': '/dashboard/messages',
          'Analytics': '/dashboard/analytics',
          'Opportunities': '/dashboard/opportunities',
          'Settings': '/dashboard/settings',
          'Public Profile': '/p',
        };
        router.push(routes[item.label] || '/dashboard');
        onClose();
      },
    })),
    ...ACTION_ITEMS.map((item, i) => ({
      ...item,
      id: `action-${i}`,
      action: () => {
        const routes: Record<string, string> = {
          'New Proof Card': '/dashboard/proof/new',
          'Import from URL': '/dashboard/proof/new',
          'Start AI Chat': '/dashboard/ai',
        };
        if (routes[item.label]) {
          router.push(routes[item.label]);
        }
        onClose();
      },
    })),
  ];

  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const grouped = {
    navigation: filtered.filter((i) => i.category === 'navigation'),
    actions: filtered.filter((i) => i.category === 'actions'),
    recent: filtered.filter((i) => i.category === 'recent'),
  };

  const flatFiltered = [...grouped.recent, ...grouped.navigation, ...grouped.actions];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const executeItem = useCallback(
    (item: CommandItem) => {
      item.action();
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatFiltered[selectedIndex]) {
          executeItem(flatFiltered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, flatFiltered, selectedIndex, executeItem, onClose]);

  // Global Cmd+K / Ctrl+K handler
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          // The parent should toggle open
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [open, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  let itemIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[580px] mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <span className="text-lg">🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, pages, or actions..."
                className="flex-1 bg-transparent text-foreground text-[15px] placeholder:text-text-tertiary outline-none font-body"
              />
              <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-text-tertiary bg-muted rounded border border-border">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2 px-2">
              {flatFiltered.length === 0 && (
                <div className="py-8 text-center text-text-tertiary text-sm font-body">
                  No results for &quot;{query}&quot;
                </div>
              )}

              {grouped.navigation.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider font-body">
                    Pages
                  </div>
                  {grouped.navigation.map((item) => {
                    itemIndex++;
                    const isSelected = itemIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-accent text-foreground' : 'text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium font-body truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-[12px] text-text-tertiary font-body truncate">{item.description}</div>
                          )}
                        </div>
                        {item.shortcut && (
                          <div className="flex gap-0.5">
                            {item.shortcut.map((key) => (
                              <kbd
                                key={key}
                                className="flex items-center justify-center w-5 h-5 text-[10px] font-mono text-text-tertiary bg-muted rounded border border-border"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {grouped.actions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 mt-1 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider font-body">
                    Actions
                  </div>
                  {grouped.actions.map((item) => {
                    itemIndex++;
                    const isSelected = itemIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-accent text-foreground' : 'text-foreground hover:bg-accent/50'
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium font-body truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-[12px] text-text-tertiary font-body truncate">{item.description}</div>
                          )}
                        </div>
                        {item.shortcut && (
                          <div className="flex gap-0.5">
                            {item.shortcut.map((key) => (
                              <kbd
                                key={key}
                                className="flex items-center justify-center w-5 h-5 text-[10px] font-mono text-text-tertiary bg-muted rounded border border-border"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
              <div className="flex items-center gap-3 text-[11px] text-text-tertiary font-body">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">↵</kbd>
                  select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">esc</kbd>
                  close
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
