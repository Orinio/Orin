'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-glass border-b border-[var(--color-border)] shadow-soft-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5 group animate-fadeIn">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-ink)] flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg">
            <span className="text-sm font-bold" style={{ color: 'var(--color-spark)' }}>O</span>
          </div>
          <span className="text-xl font-bold tracking-tight animate-fadeInRight" style={{ color: 'var(--color-ink)' }}>
            ORIN
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how' },
            { label: 'Pricing', href: '#pricing' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-all duration-200 hover:text-[var(--color-ink)] hover:scale-105 hover-lift"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="hidden sm:inline-flex text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-all duration-200 hover:bg-[var(--color-surface-dim)] hover:scale-105"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary px-5 py-2.5 rounded-[var(--radius-md)] text-sm hover-lift hover:scale-105 transition-transform">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
