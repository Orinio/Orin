'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const painPoints = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Tab chaos',
    desc: 'Six repos, three PDFs, a Notion doc, and that Kaggle notebook you forgot about.',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #e53e3e 100%)',
    accent: 'card-accent-ember',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    title: 'Proof feels scattered',
    desc: 'Hard to show employers what you can actually do when your work is everywhere.',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
    accent: 'card-accent-pulse',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    title: 'No guidance',
    desc: 'You built things but have no idea what to build next to stand out.',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
    accent: 'card-accent-spark',
  },
];

export default function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-32 px-6 relative overflow-hidden grain-overlay" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.04]" style={{ backgroundColor: 'var(--color-pulse)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-ember)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div>
            <ScrollReveal direction="up" delay={0}>
              <div className="badge-pulse mb-6">The Problem</div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.1}>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight" style={{ color: 'var(--color-ink)' }}>
                You built a lot.<br />
                <span className="gradient-text-ember">Showing it is hard.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2}>
              <p className="text-lg md:text-xl leading-relaxed max-w-md" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                Every student has proof of their skills — scattered across GitHub, Notion, Google Drive, and email. None of it connects. None of it tells a story.
              </p>
            </ScrollReveal>

            {/* Decorative line */}
            <ScrollReveal direction="up" delay={0.35}>
              <div className="line-reveal mt-10" />
            </ScrollReveal>
          </div>

          {/* Right: Pain points */}
          <div className="space-y-5" ref={ref}>
            {painPoints.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, x: 60 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.7,
                  delay: 0.1 + i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className={`card-base ${point.accent} p-6 flex items-start gap-4 glow-border hover-lift`}>
                  <div
                    className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-500 hover:scale-110"
                    style={{ background: point.gradient, color: '#fff' }}
                  >
                    {point.icon}
                  </div>
                  <div>
                    <h3 className="font-bold mb-1 text-lg" style={{ color: 'var(--color-ink)' }}>
                      {point.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                      {point.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
