'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const steps = [
  {
    num: '01',
    title: 'Connect your sources',
    desc: 'Link GitHub, Kaggle, certificates, and more. One-time setup, 2 minutes.',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    num: '02',
    title: 'ORIN builds your proof',
    desc: 'AI scans your work, identifies proof points, and generates source-linked Proof Cards.',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    num: '03',
    title: 'Get coached daily',
    desc: 'AI coach reviews your progress, suggests next steps, and pushes you toward your goals.',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    num: '04',
    title: 'Land opportunities',
    desc: 'Get matched to roles that fit YOUR proof. Not random listings — curated fits.',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="how" className="py-24 px-6 relative" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="max-w-6xl mx-auto text-center mb-16">
        <ScrollReveal direction="up" delay={0}>
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'var(--color-ember)', color: '#FFFFFF' }}
          >
            How It Works
          </span>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Four steps to{' '}
            <span className="gradient-text-ember">getting hired</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            From scattered tabs to hired — in minutes, not months.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.05 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="card-base p-6 h-full relative overflow-hidden">
                <span
                  className="absolute -top-4 -right-2 text-[100px] font-bold leading-none pointer-events-none select-none"
                  style={{
                    background: step.gradient,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    opacity: 0.06,
                  }}
                >
                  {step.num}
                </span>
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-bold mb-4"
                    style={{ background: step.gradient, color: '#fff' }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
