import Link from 'next/link';

const footerLinks = {
  Product: [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'How it works', href: '/#how' },
    { name: 'Changelog', href: '/changelog' },
  ],
  Resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Help Center', href: '/help' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
    { name: 'Legal', href: '/legal' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black pt-20 sm:pt-24 pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* BIG STARTUP PRE-FOOTER CTA */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16 pb-16 border-b border-white/10">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
              <span className="text-white/15">Start building your </span>
              <span style={{ color: 'var(--color-spark)' }}>proof.</span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg leading-relaxed">
              Join 5,000+ top builders who have already turned their scattered work into a verified career identity.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl text-white font-bold text-sm text-center transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{
                backgroundColor: 'var(--color-pulse)',
                boxShadow: '0 0 20px rgba(238,66,102,0.4)',
              }}
            >
              Get Started — Free
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl border border-zinc-700 text-white font-bold text-sm text-center hover:bg-zinc-900 transition-colors duration-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12 lg:gap-8 mb-16">
          {/* Brand & Mission Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-3 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-3 mb-6 group" aria-label="ORIN home">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white transition-transform duration-200 group-hover:scale-105">
                <span className="text-lg font-black tracking-wider text-black">O</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">ORIN</span>
            </Link>

            <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
              Turn scattered work into verified career proof. Built for the next generation of builders, creators, and students.
            </p>

            {/* System status pill */}
            <Link
              href="/status"
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-800 hover:bg-zinc-900 transition-colors duration-200"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-pulse-slow"
                  style={{ backgroundColor: 'var(--color-bloom)' }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: 'var(--color-bloom)' }}
                />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">All systems operational</span>
            </Link>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="lg:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-150"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <p className="text-sm text-zinc-500">
            &copy; {currentYear} ORIN Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
              aria-label="X (formerly Twitter)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
