import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Proof Cards',
    desc: 'Auto-generated cards from your work, verified with links to the source. Every project, cert, and contribution becomes tangible proof.',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
        <circle cx="9" cy="14" r="1.3" fill="currentColor" />
        <circle cx="15" cy="14" r="1.3" fill="currentColor" />
      </svg>
    ),
    title: 'AI Coach',
    desc: 'Daily nudges based on your actual proof. "You are 80% ready for X role — ship one live deploy this week."',
    gradient: 'linear-gradient(135deg, var(--color-ink) 0%, #2d3748 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Job Board',
    desc: 'Internships and roles matched to YOUR proof. Not random listings — opportunities where your skills are the exact fit.',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    title: 'Public Profile',
    desc: 'Shareable link: yourname.orin.dev. Clean, verified, and way more credible than a raw GitHub page.',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Proof Score',
    desc: 'A real measure of your career readiness. Track weekly trends and see where you rank among peers.',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Daily Check-ins',
    desc: 'AI coach asks what you shipped, reviews progress, and adjusts your roadmap. Like a mentor that never sleeps.',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
];

const deepDives = [
  {
    title: 'Cloud Storage Connectors',
    desc: 'Connect Google Drive, Dropbox, OneDrive, Notion, and GitHub. Orin imports files read-only, extracts skills and projects, and turns them into verified proof cards.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      </svg>
    ),
  },
  {
    title: 'AI-Powered Verification',
    desc: 'Every proof card goes through our verification pipeline. AI checks source links, validates certificates, and flags inconsistencies before anything gets marked verified.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Skill Gap Analysis',
    desc: 'See exactly what skills you need for your target role. Our AI compares your proof against job requirements and generates a personalized learning path.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Team & Career Services',
    desc: 'Career offices and student clubs get shared coach notes, bulk LMS import, and a custom-branded portfolio template for up to 25 students.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function FeaturesPage() {
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
            style={{ backgroundColor: 'var(--color-spark)' }}
          />
          <div
            className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl opacity-[0.05] animate-pulse-slower"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-bloom mb-6 animate-fadeInUp">Features</div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            Everything you need to{' '}
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
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            No more sending PDFs and hoping they open them. One link. Verified proof. Real results.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <Link href="/signup" className="btn-primary text-base">
              Start Building Proof
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="btn-outline text-base">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="card-base p-7 group animate-fadeInUp"
              style={{ animationDelay: `${0.1 + i * 0.05}s` }}
            >
              <div
                className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-4 shadow-md transition-transform duration-300 group-hover:scale-110"
                style={{ background: feature.gradient, color: 'var(--color-paper)' }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Deep Dives */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
              Built different, under the hood
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              The details that make Orin more than just another portfolio tool.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {deepDives.map((item, i) => (
              <div
                key={item.title}
                className="card-premium p-7 animate-fadeInUp"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div
                  className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-bloom)', color: 'var(--color-paper)' }}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.desc}
                </p>
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
            Ready to turn your work into proof?
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--color-mist)' }}>
            Join 5,000+ students who stopped hoping and started proving.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
          >
            Start free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
