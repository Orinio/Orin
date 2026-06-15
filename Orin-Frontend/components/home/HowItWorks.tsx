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
    desc: 'AI scans your work, identifies proof points, and generates verified Proof Cards.',
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
    <section id="how" className="py-32 px-6 relative overflow-hidden grain-overlay" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-ember)' }} />
      </div>

      <div className="max-w-6xl mx-auto text-center mb-20 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-ember mb-6">How It Works</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Four steps to{' '}
            <span className="gradient-text-ember">career proof</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            From scattered tabs to verified proof in minutes, not months.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-5xl mx-auto relative z-10">
        <div className="grid sm:grid-cols-2 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className="relative"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.05 + i * 0.1,
                ease: [0.16,1,0.3,1]
              }}
            >
              <div className="card-base p-8 h-full group glow-border card-accent-bottom relative overflow-hidden">
                {/* Background number */}
                <span className="absolute -top-4 -right-2 text-[120px] font-bold leading-none pointer-events-none select-none transition-all duration-500 group-hover:opacity-[0.1] group-hover:scale-110"
                  style={{
                    background: step.gradient,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    opacity: 0.05,
                  }}
                >
                  {step.num}
                </span>
                <div className="relative">
                  <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center text-base font-bold mb-5 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl"
                    style={{ background: step.gradient, color: '#fff' }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-ink)' }}>
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
