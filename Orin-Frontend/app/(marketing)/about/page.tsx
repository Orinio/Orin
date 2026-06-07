import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const values = [
  {
    title: 'Proof over promises',
    desc: 'We believe what you have built speaks louder than what you claim. Every feature in Orin exists to make your work visible, verifiable, and impossible to ignore.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Students first, always',
    desc: 'Free means free. Not trial. Not limited. We make money when teams pay, so individual students never have to.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Privacy is non-negotiable',
    desc: 'Your cloud accounts are accessed read-only. We never write to your GitHub, Drive, or Dropbox. Disconnect anytime and access is revoked instantly.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'AI as a guide, not a crutch',
    desc: 'Our AI coach nudges you toward action. It does not write your projects or fake your proof. It helps you see what to do next, based on what you have already done.',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
];

const milestones = [
  { year: '2024', event: 'Founded', desc: 'Started as a side project to solve our own job search problem.' },
  { year: '2024', event: 'First 100 students', desc: 'Launched to a small group of beta testers at 3 universities.' },
  { year: '2025', event: '5,000+ active users', desc: 'Organic growth through word-of-mouth. No paid acquisition.' },
  { year: '2025', event: 'AI Coach launch', desc: 'Shipped the AI career coach with daily personalized guidance.' },
  { year: '2026', event: 'Team plan', desc: 'Building tools for career services offices and student organizations.' },
];

export default function AboutPage() {
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
            style={{ backgroundColor: 'var(--color-ember)' }}
          />
          <div
            className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl opacity-[0.05] animate-pulse-slower"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-ink mb-6 animate-fadeInUp">About ORIN</div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            We believe your work should{' '}
            <span className="relative inline-block">
              speak for itself
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
            ORIN helps students turn scattered projects, repos, and certificates into verified career proof. Built by people who lived the same problem.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: 'var(--color-ink)' }}>
              The problem we are solving
            </h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Students have work everywhere — GitHub repos, Kaggle notebooks, Google Drive certificates, hackathon submissions. But none of it connects. Recruiters see a scattered trail of links, not a coherent story.
            </p>
            <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              ORIN brings it all together. We pull your work from the sources where it lives, verify it is real, and present it as a clean portfolio of proof. Add an AI coach that knows your actual strengths, and you get guidance that is specific to you — not generic career advice.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card-base p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-bloom)' }}>5,000+</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Active students</p>
            </div>
            <div className="card-base p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-ember)' }}>18,300+</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Proof cards created</p>
            </div>
            <div className="card-base p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-pulse)' }}>88%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Feel career-ready</p>
            </div>
            <div className="card-base p-5 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-spark)' }}>4.9/5</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>User satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
              What we stand for
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="card-base p-7 animate-fadeInUp"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div
                  className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-ink)', color: '#fff' }}
                >
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                  {v.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
              Our journey
            </h2>
          </div>
          <div className="relative">
            <div
              className="absolute left-4 top-0 bottom-0 w-px"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div
                  key={i}
                  className="relative pl-12 animate-fadeInUp"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div
                    className="absolute left-2.5 top-1 w-3 h-3 rounded-full border-2"
                    style={{ borderColor: 'var(--color-bloom)', backgroundColor: 'var(--color-surface)' }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-bloom)' }}>
                    {m.year}
                  </span>
                  <h3 className="text-base font-bold mt-1" style={{ color: 'var(--color-ink)' }}>
                    {m.event}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
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
            Come build with us
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--color-mist)' }}>
            Whether you are a student, a career services team, or just curious — we would love to hear from you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
