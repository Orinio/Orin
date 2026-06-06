'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll position to trigger the subtle glassmorphism transition
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Standard Startup Main Links
  const mainLinks = [
    { name: 'Product', href: '#product' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Customers', href: '/customers' },
  ];

  // Standard Startup Resources & Company Links
  const dropdownLinks = [
    { name: 'Documentation', href: '/docs', description: 'Integrate and build' },
    { name: 'Blog', href: '/blog', description: 'Latest news and updates' },
    { name: 'Careers', href: '/careers', description: 'Join our growing team' },
    { name: 'Contact Sales', href: '/contact', description: 'Get in touch with us' },
  ];

  return (
    <header 
      className={`fixed top-0 z-50 w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
        
        {/* BRAND / LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105 shadow-sm bg-[var(--color-ink,slate-900)]">
            <span className="text-sm font-black tracking-wider text-white">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors">
            ORIN
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center space-x-2 text-sm font-semibold">
          {mainLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="relative px-4 py-2 rounded-full transition-all duration-300 text-slate-600 hover:text-slate-900 group overflow-hidden"
            >
              <span className="relative z-10">{link.name}</span>
              {/* Subtle Hover Background */}
              <span className="absolute inset-0 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 rounded-full z-0 bg-slate-100" />
            </a>
          ))}

          {/* RESOURCES DROPDOWN */}
          <div className="relative group px-2 py-2">
            <button className="flex items-center gap-1.5 text-slate-600 group-hover:text-slate-900 transition-colors focus:outline-none rounded-full px-2 py-1">
              Resources <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
            </button>
            
            {/* Dropdown Panel */}
            <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-xl py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 bg-white border border-slate-100">
              {dropdownLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="block px-5 py-3 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="text-sm font-semibold text-slate-900">{link.name}</div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">{link.description}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="w-px h-5 mx-3 bg-slate-200 transition-colors duration-500" /> 

          {/* ACTION BUTTONS */}
          <Link 
            href="/signin" 
            className="text-sm font-semibold px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300"
          >
            Log in
          </Link>
          <Link 
            href="/signup" 
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 active:scale-95 bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md ml-1"
          >
            Get Started
          </Link>
        </nav>

        {/* MOBILE MENU TRIGGER */}
        <button 
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-300 focus:outline-none" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE EXPANSION PANEL */}
      <div className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-10 bg-white/95 backdrop-blur-xl ${
        isOpen ? 'max-h-[800px] border-b border-slate-200 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <nav className="flex flex-col px-6 py-6 space-y-1">
          {mainLinks.map((link) => (
            <a 
              key={link.href} 
              href={link.href} 
              className="px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          
          <div className="my-2 h-px bg-slate-100 w-full" />
          
          {dropdownLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="px-4 py-3 rounded-xl transition-all duration-200 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              <div className="text-sm font-semibold text-slate-700">{link.name}</div>
            </Link>
          ))}
          
          <div className="pt-6 mt-2 flex flex-col gap-3">
            <Link 
              href="/signin" 
              className="block w-full text-center px-4 py-3 text-sm font-bold rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              Log In
            </Link>
            <Link 
              href="/signup" 
              className="block w-full text-center px-4 py-3 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 shadow-sm" 
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}