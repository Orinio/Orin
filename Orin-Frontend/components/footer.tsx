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
    <footer className="relative overflow-hidden" style={{ backgroundColor: 'var(--color-ink)' }}>
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(11,171,119,0.15), transparent)',
      }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 sm:pt-24 pb-10">
        {/* Pre-footer CTA */}
        <div className="mb-16 pb-16 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
              <span style={{ color: 'rgba(255,255,255,0.12)' }}>Start building your </span>
              <span style={{ color: 'var(--color-spark)' }}>proof.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Join 5,000+ top builders who have already turned their scattered work into a verified career identity.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <Link
              href="/signup"
              className="btn-primary px-6 py-3 text-center text-sm"
            >
              Get Started — Free
            </Link>
            <Link
              href="/contact"
              className="btn-outline px-6 py-3 text-center text-sm"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Main Footer Columns */}
        <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6 md:gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 flex flex-col items-start md:col-span-4 lg:col-span-3">
            <Link href="/" className="mb-6 flex items-center gap-3 group" aria-label="ORIN home">
              <div className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: 'var(--color-paper)' }}>
                <span className="text-lg font-black tracking-wider" style={{ color: 'var(--color-ink)' }}>O</span>
              </div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-paper)' }}>ORIN</span>
            </Link>

            <p className="mb-8 max-w-sm text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Turn scattered work into verified career proof. Built for the next generation of builders, creators, and students.
            </p>

            {/* Status pill */}
            <Link
              href="/status"
              className="inline-flex items-center gap-3 rounded-full px-4 py-2 transition-colors duration-200 hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-pulse-slow rounded-full opacity-50"
                  style={{ backgroundColor: 'var(--color-bloom)' }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-bloom)' }}
                />
              </span>
              <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--color-paper)' }}>All systems operational</span>
            </Link>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="lg:col-span-1">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium transition-colors duration-150 hover:text-white"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-6 pt-8 sm:flex-row" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            &copy; {currentYear} ORIN Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:-translate-y-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              aria-label="X (formerly Twitter)"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:-translate-y-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              aria-label="GitHub"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all duration-200 hover:-translate-y-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
