'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

const studentPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to start building proof.',
    features: ['3 proof cards', 'AI coach (basic)', 'Public profile', 'Job board access'],
    cta: 'Start Free',
    highlighted: false,
    btnClass: 'btn-outline',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For students serious about getting hired.',
    features: [
      'Unlimited proof cards',
      'AI coach (advanced)',
      'Skill gap engine',
      'Priority opportunity matching',
      'Proof analytics — see who views your cards',
      'Export to PDF & resume builder',
    ],
    cta: 'Go Pro',
    highlighted: true,
    btnClass: 'btn-primary',
  },
];

const institutionPlans = [
  {
    name: 'University',
    price: '$99',
    period: '/month',
    desc: 'For career services offices tracking student outcomes.',
    features: [
      'Unlimited student seats',
      'Career services dashboard',
      'Bulk cohort verification',
      'Student outcome analytics for accreditation',
      'Branded proof portfolios',
      'Dedicated support & onboarding',
    ],
    cta: 'Book a Demo',
    highlighted: true,
    btnClass: 'btn-primary',
    href: '/contact?plan=university',
  },
  {
    name: 'Bootcamp',
    price: '$49',
    period: '/month',
    desc: 'For bootcamps proving graduate placement rates.',
    features: [
      'Up to 25 student seats',
      'Bulk proof generation per cohort',
      'Placement rate tracking',
      'Branded graduate portfolios',
      'Employer presentation mode',
      'API access',
    ],
    cta: 'Book a Demo',
    highlighted: false,
    btnClass: 'btn-secondary',
    href: '/contact?plan=bootcamp',
  },
];

const employerCta = {
  name: 'For Employers',
  price: 'Custom',
  period: '',
  desc: 'Search verified talent. Skip the resume keyword bingo.',
  features: [
    'Search verified student profiles',
    'Skill confidence scores, not self-reported claims',
    'Contact candidates through Orin',
    'Save 1-2 hours per candidate screening',
    'Reduce false-positive hires',
    'Integrate with your ATS',
  ],
  cta: 'Join Waitlist',
  highlighted: false,
  btnClass: 'btn-outline',
  href: '/employers/waitlist',
};

export default function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="pricing" className="py-32 px-6 relative overflow-hidden grain-overlay" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>

      {/* Student pricing */}
      <div className="max-w-6xl mx-auto text-center mb-20 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-ember mb-6">Pricing</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Free for students.{' '}
            <span className="gradient-text-ember">Institutions pay.</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Students should never have to pay to prove their work. Start free. Upgrade when you want more.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6 relative z-10 items-start mb-20">
        {studentPlans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.05 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className={`relative p-8 rounded-[var(--radius-xl)] h-full flex flex-col ${
                plan.highlighted
                  ? 'shadow-2xl border-2'
                  : 'card-base'
              }`}
              style={{
                ...(plan.highlighted && {
                  borderColor: 'var(--color-pulse)',
                  background: 'linear-gradient(180deg, rgba(238,66,102,0.03) 0%, var(--color-surface) 40%)',
                }),
              }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 badge-pulse text-xs shadow-lg">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                  {plan.period}
                </span>
              </div>
              <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                {plan.desc}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-ink)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`${plan.btnClass} w-full justify-center text-base`}
              >
                {plan.cta}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Institution pricing */}
      <div className="max-w-6xl mx-auto text-center mb-12 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-ink mb-6">For Universities & Bootcamps</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
            Track student outcomes. Verify graduate skills.
          </h3>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Career services is understaffed. Bootcamps need proof of placement. Orin gives you the dashboard to track, verify, and present real student outcomes.
          </p>
        </ScrollReveal>
      </div>

      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6 relative z-10 items-start mb-16">
        {institutionPlans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.3 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className={`relative p-8 rounded-[var(--radius-xl)] h-full flex flex-col ${
                plan.highlighted
                  ? 'shadow-2xl border-2'
                  : 'card-base'
              }`}
              style={{
                ...(plan.highlighted && {
                  borderColor: 'var(--color-bloom)',
                  background: 'linear-gradient(180deg, rgba(5,150,105,0.03) 0%, var(--color-surface) 40%)',
                }),
              }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 badge-bloom text-xs shadow-lg">
                  Best Value
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                  {plan.period}
                </span>
              </div>
              <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                {plan.desc}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--color-ink)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href || '/signup'}
                className={`${plan.btnClass} w-full justify-center text-base`}
              >
                {plan.cta}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Employer CTA */}
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="card-base p-8 text-center glow-border card-accent-bottom">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
              {employerCta.name}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
              {employerCta.desc}
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-6 text-left">
              {employerCta.features.slice(0, 3).map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
                  <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-ember)' }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
            {employerCta.href ? (
              <Link href={employerCta.href} className={`${employerCta.btnClass} text-base`}>
                {employerCta.cta}
              </Link>
            ) : (
              <button type="button" className={`${employerCta.btnClass} text-base`}>
                {employerCta.cta}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
