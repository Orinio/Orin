'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import Logo from '@/components/Logo';

const mainLinks = [
  { name: 'Features', href: '/#features' },
  { name: 'How it works', href: '/#how' },
  { name: 'Pricing', href: '/#pricing' },
  { name: 'FAQ', href: '/faq' },
];

const resourceLinks = [
  { name: 'Documentation', href: '/docs', description: 'Integrate and build' },
  { name: 'Blog', href: '/blog', description: 'Latest news and updates' },
  { name: 'Careers', href: '/careers', description: 'Join our growing team' },
  { name: 'Contact', href: '/contact', description: 'Get in touch with us' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = () => setIsOpen(false);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* BRAND / LOGO */}
        <Logo variant="full" size="lg" priority />

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100/80"
            >
              {link.name}
            </Link>
          ))}

          {/* RESOURCES DROPDOWN */}
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors duration-200 focus:outline-none rounded-full px-4 py-2"
              aria-haspopup="true"
            >
              Resources
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
            </button>

            {/* Dropdown Panel */}
            <div
              className="absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-xl ring-1 ring-slate-200/80 bg-white py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus-within:opacity-100 focus-within:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0"
              role="menu"
            >
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-5 py-3 hover:bg-slate-50 transition-colors duration-150"
                  role="menuitem"
                >
                  <div className="text-sm font-semibold text-slate-900">{link.name}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">{link.description}</div>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* ACTION BUTTONS (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/signin"
            className="text-sm font-semibold px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>

        {/* MOBILE MENU TRIGGER */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE EXPANSION PANEL */}
      <div
        className={`md:hidden fixed inset-x-0 top-[60px] bottom-0 overflow-y-auto transition-all duration-300 ease-out bg-white ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <nav className="flex flex-col px-6 py-6 space-y-1">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
            >
              {link.name}
            </Link>
          ))}

          <div className="my-3 h-px bg-slate-100 w-full" />

          <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Resources
          </p>
          {resourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-150"
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-6 mt-3 flex flex-col gap-3 border-t border-slate-100">
            <Link
              href="/signin"
              onClick={closeMenu}
              className="block w-full text-center px-4 py-3 text-sm font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={closeMenu}
              className="block w-full text-center px-4 py-3 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
