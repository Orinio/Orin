import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const sections = [
  {
    title: 'Getting Started',
    desc: 'Create your account, connect your first source, and build your proof profile.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: 'Proof Cards',
    desc: 'How proof cards work, verification states, and how to manage your proof portfolio.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Cloud Connectors',
    desc: 'Connect Google Drive, Dropbox, OneDrive, Notion, and GitHub to auto-import your work.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
  {
    title: 'AI Coach',
    desc: 'How the AI career coach works, daily check-ins, and personalized learning paths.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
        <circle cx="9" cy="14" r="1.3" fill="currentColor" />
        <circle cx="15" cy="14" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Public Profiles',
    desc: 'Share your proof portfolio with a custom link. Control what is visible.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    title: 'Opportunities & Job Board',
    desc: 'How skill-matched opportunities work and how to apply through Orin.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

export default function DocsPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-28 pb-16 px-6"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-[0.07] animate-pulse-slow"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-bloom mb-6 animate-fadeInUp">Documentation</div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            Orin Documentation
          </h1>
          <p
            className="text-lg max-w-xl mx-auto animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            Everything you need to get the most out of Orin. From first setup to advanced features.
          </p>
        </div>
      </section>

      {/* Doc Sections */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sections.map((section, i) => (
            <div
              key={section.title}
              className="card-base p-7 group cursor-pointer animate-fadeInUp"
              style={{ animationDelay: `${0.1 + i * 0.06}s` }}
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'var(--color-bloom)', color: '#fff' }}
              >
                {section.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:underline" style={{ color: 'var(--color-ink)' }}>
                {section.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {section.desc}
              </p>
              <div className="mt-4">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: 'var(--color-bloom)' }}
                >
                  Read docs
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center" style={{ color: 'var(--color-ink)' }}>
            Quick links
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/faq"
              className="card-base p-5 flex items-center gap-4 group"
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-ember)', color: '#fff' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:underline" style={{ color: 'var(--color-ink)' }}>FAQ</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Common questions answered</p>
              </div>
            </Link>
            <Link
              href="/contact"
              className="card-base p-5 flex items-center gap-4 group"
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-pulse)', color: '#fff' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold group-hover:underline" style={{ color: 'var(--color-ink)' }}>Contact Support</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Get help from our team</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 px-6"
        style={{ backgroundColor: 'var(--color-ink)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3 text-white">
            Ready to get started?
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-mist)' }}>
            Create your free account and start building proof in minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
