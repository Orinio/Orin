import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Solutions', href: '#solutions' },
      { name: 'Changelog', href: '/changelog' },
    ],
    Resources: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Blog', href: '/blog' },
      { name: 'Community', href: '/community' },
      { name: 'Help Center', href: '/help' },
    ],
    Company: [
      { name: 'About', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact Sales', href: '/contact' },
      { name: 'Legal', href: '/legal' },
    ],
  };

  return (
    <footer className="relative bg-black pt-24 pb-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* BIG STARTUP PRE-FOOTER CTA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 pb-16 border-b border-white/10">
          <div className="mb-8 md:mb-0 max-w-xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {/* Faded text matching your screenshot perfectly */}
              <span className="text-white/5">Start building your </span>
              {/* Bright yellow accent text */}
              <span className="text-[#F4E409]">proof.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Join 5,000+ top builders who have already turned their scattered work into a verified career identity.
            </p>
          </div>
          
          <div className="flex flex-row gap-4 w-full md:w-auto">
            {/* Glowing Red/Pink Primary Button */}
            <Link 
              href="/signup" 
              className="px-6 py-3 rounded-xl bg-[#EE4266] text-white font-bold text-sm text-center w-full md:w-auto hover:bg-[#D63A5B] transition-all duration-300 shadow-[0_0_20px_rgba(238,66,102,0.4)] hover:shadow-[0_0_25px_rgba(238,66,102,0.6)] hover:-translate-y-0.5"
            >
              Get Started — Free
            </Link>
            
            {/* Outline Button (Fixed invisible text from screenshot) */}
            <Link 
              href="/contact" 
              className="px-6 py-3 rounded-xl border border-zinc-700 text-white font-bold text-sm text-center w-full md:w-auto hover:bg-zinc-900 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Mission Column */}
          <div className="lg:col-span-3 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white transition-transform duration-300 group-hover:scale-105">
                <span className="text-lg font-black tracking-wider text-black">O</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                ORIN
              </span>
            </Link>
            
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
              Turn scattered work into verified career proof. Built for the next generation of builders, creators, and students.
            </p>

            {/* Dark Outline System Status Pill */}
            <a 
              href="/status" 
              className="flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-800 bg-transparent hover:bg-zinc-900 transition-all duration-300"
            >
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#0BAB77] opacity-40 animate-pulse" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0BAB77]" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                All systems operational
              </span>
            </a>
          </div>

          {/* Clean Link Columns (Headers Removed as per screenshot) */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="lg:col-span-1 pt-2">
              <ul className="space-y-5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-sm font-bold text-white hover:text-zinc-400 transition-colors duration-200 tracking-wide"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR: Copyright & Socials */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm font-semibold text-zinc-400">
            &copy; {currentYear} ORIN Inc. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            {/* Twitter / X */}
            <a href="#" className="text-zinc-400 hover:text-white transition-all duration-300 hover:-translate-y-0.5" aria-label="X (formerly Twitter)">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* GitHub */}
            <a href="#" className="text-zinc-400 hover:text-white transition-all duration-300 hover:-translate-y-0.5" aria-label="GitHub">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" className="text-zinc-400 hover:text-white transition-all duration-300 hover:-translate-y-0.5" aria-label="LinkedIn">
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