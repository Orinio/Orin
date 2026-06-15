'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

const plans = [
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
    desc: 'For students serious about standing out.',
    features: [
      'Unlimited proof cards',
      'AI coach (advanced)',
      'Priority matching',
      'Custom profile themes',
      'Proof analytics',
      'Export to PDF',
    ],
    cta: 'Go Pro',
    highlighted: true,
    btnClass: 'btn-primary',
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    desc: 'For student orgs and bootcamps.',
    features: [
      'Everything in Pro',
      'Team dashboard',
      'Bulk proof generation',
      'Branded profiles',
      'API access',
      'Dedicated support',
    ],
    cta: 'Contact Us',
    highlighted: false,
    btnClass: 'btn-secondary',
  },
];

export default function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="pricing" className="py-32 px-6 relative overflow-hidden grain-overlay" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>

      <div className="max-w-6xl mx-auto text-center mb-20 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-ember mb-6">Pricing</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Simple, <span className="gradient-text-ember">student-friendly</span> pricing
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Start free. Upgrade when you are ready.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 items-start">
        {plans.map((plan, i) => (
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
    </section>
  );
}
