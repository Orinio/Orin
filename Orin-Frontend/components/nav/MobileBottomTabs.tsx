'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, PlusCircle, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/feed', label: 'Feed', icon: BarChart3 },
  { href: '/dashboard/proof/new', label: 'Add', icon: PlusCircle, isCenter: true },
  { href: '/dashboard/network', label: 'Network', icon: User },
  { href: '/dashboard/messages', label: 'Chat', icon: Sparkles },
];

export default function MobileBottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)]"
      aria-label="Mobile navigation"
      style={{
        boxShadow: '0 -1px 3px rgba(0,0,0,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-[68px] px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          if (tab.isCenter) {
            return (
              <Link key={tab.href} href={tab.href} className="relative -mt-5 flex flex-col items-center justify-center">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-bloom), #0A9A6A)',
                    boxShadow: '0 4px 16px rgba(11,171,119,0.35)',
                  }}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className="mt-1 text-[10px] font-semibold" style={{ color: 'var(--color-bloom)' }}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-all duration-200 active:scale-95"
            >
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors duration-200"
                style={{
                  backgroundColor: active ? 'var(--color-bloom)12' : 'transparent',
                }}
              >
                <Icon
                  className="h-5 w-5 transition-colors duration-200"
                  style={{ color: active ? 'var(--color-bloom)' : '#64748b' }}
                />
              </div>
              <span
                className="text-[10px] font-semibold transition-colors duration-200"
                style={{ color: active ? 'var(--color-bloom)' : '#64748b' }}
              >
                {tab.label}
              </span>
              {active && (
                <div className="h-1 w-1 rounded-full mt-0.5" style={{ backgroundColor: 'var(--color-bloom)' }} aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
