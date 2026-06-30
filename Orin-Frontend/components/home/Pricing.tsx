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
      'Proof analytics',
      'Export to PDF',
    ],
    cta: 'Go Pro',
    highlighted: true,
  },
];

export default function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="pricing" className="py-24 px-6 relative" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="max-w-6xl mx-auto text-center mb-16">
        <ScrollReveal direction="up" delay={0}>
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'var(--color-ember)', color: '#FFFFFF' }}
          >
            Pricing
          </span>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Free for students.{' '}
            <span className="gradient-text-ember">Institutions pay.</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Students should never have to pay to prove their work. Start free. Upgrade when you want more.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-5 items-start">
        {studentPlans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.05 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className={`relative p-6 rounded-[var(--radius-xl)] h-full flex flex-col ${
                plan.highlighted
                  ? 'shadow-lg border-2'
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
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--color-pulse)', color: '#FFFFFF' }}
                >
                  Most Popular
                </span>
              )}

              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                  {plan.period}
                </span>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                {plan.desc}
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`w-full justify-center text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-md)] transition-all duration-200 ${
                  plan.highlighted
                    ? 'text-white'
                    : 'border-2'
                }`}
                style={{
                  ...(plan.highlighted
                    ? { backgroundColor: 'var(--color-pulse)', boxShadow: 'var(--shadow-colored-pulse)' }
                    : { borderColor: 'var(--color-border-strong)', color: 'var(--color-ink)' }
                  ),
                }}
              >
                {plan.cta}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
