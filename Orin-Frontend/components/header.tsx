'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import Logo from '@/components/Logo';

const mainLinks = [
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'FAQ', href: '/faq' },
];

const resourceLinks = [
  { name: 'Documentation', href: '/docs', description: 'Guides and API references' },
  { name: 'Blog', href: '/blog', description: 'Latest news and updates' },
  { name: 'Status', href: '/status', description: 'System health dashboard' },
  { name: 'Contact', href: '/contact', description: 'Get in touch with us' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout>(null);

  const closeMenu = () => setIsOpen(false);

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

  const handleDropdownEnter = (name: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          scrolled
            ? 'bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)]'
            : 'bg-transparent border-b border-transparent'
        }`}
        style={{
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : undefined,
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : undefined,
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo variant="full" size="lg" priority />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 rounded-full text-[13px] font-semibold text-slate-600 hover:text-slate-900 transition-all duration-200 hover:bg-black/[0.04] active:scale-[0.97]"
                >
                  {link.name}
                </Link>
              ))}

              {/* Resources Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleDropdownEnter('resources')}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  type="button"
                  className={`flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-200 focus:outline-none rounded-full px-4 py-2 ${
                    activeDropdown === 'resources'
                      ? 'text-slate-900 bg-black/[0.04]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                  }`}
                  aria-haspopup="true"
                  aria-expanded={activeDropdown === 'resources'}
                >
                  Resources
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'resources' ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`absolute top-full right-0 mt-2.5 w-[280px] rounded-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.06] bg-white/90 backdrop-blur-xl py-2.5 transition-all duration-200 origin-top-right ${
                    activeDropdown === 'resources'
                      ? 'opacity-100 visible scale-100'
                      : 'opacity-0 invisible scale-95'
                  }`}
                  style={{
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                  }}
                  role="menu"
                  onMouseEnter={() => handleDropdownEnter('resources')}
                  onMouseLeave={handleDropdownLeave}
                >
                  {resourceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-2.5 mx-1 rounded-xl hover:bg-black/[0.04] transition-colors duration-150 group"
                      role="menuitem"
                    >
                      <div className="text-[13px] font-semibold text-slate-800 group-hover:text-slate-950 transition-colors">
                        {link.name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {link.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                href="/signin"
                className="text-[13px] font-semibold px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-black/[0.04] transition-all duration-200 active:scale-[0.97]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="group relative px-5 py-2.5 rounded-full text-[13px] font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)] transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 hover:bg-black/[0.04] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:scale-[0.95]"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              <div className="relative w-5 h-5">
                <span
                  className={`absolute left-0 block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-out ${
                    isOpen ? 'top-[7px] rotate-45' : 'top-[2px]'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-out ${
                    isOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ease-out ${
                    isOpen ? 'top-[7px] -rotate-45' : 'top-[12px]'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={closeMenu}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            WebkitBackdropFilter: isOpen ? 'blur(4px)' : undefined,
            backdropFilter: isOpen ? 'blur(4px)' : undefined,
          }}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-[min(85vw,360px)] bg-white/90 shadow-[-8px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            backdropFilter: 'blur(20px) saturate(180%)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-black/[0.06]">
              <Logo variant="full" size="md" />
              <button
                type="button"
                onClick={closeMenu}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 hover:bg-black/[0.04] transition-all duration-200 active:scale-[0.95]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-1">
                {mainLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="block px-4 py-3 rounded-xl text-[15px] font-semibold text-slate-700 hover:bg-black/[0.04] hover:text-slate-900 transition-all duration-150 active:scale-[0.98]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="my-5 h-px bg-black/[0.06] mx-2" />

              <div>
                <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Resources
                </p>
                <div className="space-y-1">
                  {resourceLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className="block px-4 py-3 rounded-xl hover:bg-black/[0.04] transition-all duration-150 active:scale-[0.98]"
                    >
                      <span className="block text-[15px] font-semibold text-slate-700">{link.name}</span>
                      <span className="block text-[12px] font-medium text-slate-400 mt-0.5">{link.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            {/* Mobile CTA */}
            <div className="px-5 pb-8 pt-6 border-t border-black/[0.06] space-y-3">
              <Link
                href="/signin"
                onClick={closeMenu}
                className="block w-full text-center px-4 py-3 text-[14px] font-bold rounded-xl text-slate-700 bg-black/[0.04] hover:bg-black/[0.07] transition-all duration-200 active:scale-[0.98]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={closeMenu}
                className="block w-full text-center px-4 py-3 text-[14px] font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all duration-200 active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
