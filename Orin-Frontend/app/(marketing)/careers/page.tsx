import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const openRoles = [
  {
    title: 'Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Build the core product — proof cards, AI coach, cloud integrations. Work with Next.js, Supabase, and Express.',
  },
  {
    title: 'AI / ML Engineer',
    team: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Build the AI verification pipeline, skill extraction, and career coach. Work with LLMs, embeddings, and retrieval systems.',
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Shape the experience for students building their career proof. Own the design system and user-facing flows.',
  },
  {
    title: 'Growth & Community',
    team: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Drive user acquisition through content, partnerships with universities, and community building.',
  },
];

const perks = [
  {
    title: 'Remote-first',
    desc: 'Work from anywhere. We are distributed across time zones and async by default.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: 'Meaningful equity',
    desc: 'Every team member gets equity. We succeed together or not at all.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    title: 'Health & wellness',
    desc: 'Full health insurance coverage and a monthly wellness stipend.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Learning budget',
    desc: '$2,000 per year for courses, conferences, books, and tools.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: 'Flexible PTO',
    desc: 'Take time off when you need it. We trust you to manage your own schedule.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Small team, big impact',
    desc: 'We are a small team. Your work ships to real users within days, not quarters.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-28 pb-20 px-6"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-[0.07] animate-pulse-slow"
            style={{ backgroundColor: 'var(--color-pulse)' }}
          />
          <div
            className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl opacity-[0.05] animate-pulse-slower"
            style={{ backgroundColor: 'var(--color-spark)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-pulse mb-6 animate-fadeInUp">Careers</div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            Help students{' '}
            <span className="relative inline-block">
              prove it
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm"
                style={{ backgroundColor: 'var(--color-spark)', opacity: 0.45 }}
              />
            </span>
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            We are a small team working on a big problem. If you care about education, AI, and building tools that actually matter — we want to talk.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
              Why work here
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map((p, i) => (
              <div
                key={p.title}
                className="card-base p-6 animate-fadeInUp"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <div
                  className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
                  style={{ backgroundColor: 'var(--color-bloom)', color: '#fff' }}
                >
                  {p.icon}
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-ink)' }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
              Open roles
            </h2>
            <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
              We are hiring across engineering, design, and growth.
            </p>
          </div>
          <div className="space-y-4">
            {openRoles.map((role, i) => (
              <div
                key={role.title}
                className="card-base p-6 flex flex-col sm:flex-row sm:items-center gap-4 animate-fadeInUp"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                    {role.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {role.desc}
                  </p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                      {role.team}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                      {role.location}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}>
                      {role.type}
                    </span>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="btn-outline text-sm flex-shrink-0"
                >
                  Apply
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-6"
        style={{ backgroundColor: 'var(--color-ink)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Do not see your role?
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--color-mist)' }}>
            We are always open to meeting great people. Send us a note and tell us what you would build.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
          >
            Get in touch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
