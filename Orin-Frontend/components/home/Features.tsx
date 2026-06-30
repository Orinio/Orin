'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const features = [
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Proof Cards',
    desc: 'Auto-generated cards from your work, linked to the source. Every project, cert, and contribution — visible proof recruiters can click through and verify.',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
    span: 'sm:col-span-2',
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
        <circle cx="9" cy="14" r="1.3" fill="currentColor" />
        <circle cx="15" cy="14" r="1.3" fill="currentColor" />
      </svg>
    ),
    title: 'AI Coach',
    desc: 'Daily nudges based on your actual proof. "You are 80% ready for X role — ship one live deploy this week."',
    gradient: 'linear-gradient(135deg, var(--color-ink) 0%, #2d3748 100%)',
    span: '',
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Job Board',
    desc: 'Internships and roles matched to YOUR proof. Not random listings — opportunities where your skills are the exact fit.',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
    span: '',
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    title: 'Public Profile',
    desc: 'Shareable link: yourname.orin.dev. Clean, verified, and way more credible than a raw GitHub page.',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
    span: '',
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Skill Gap Engine',
    desc: "Pick a target role. See exactly what you're missing. Get a 2-week action plan.",
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
    span: 'sm:col-span-2',
  },
  {
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Daily Check-ins',
    desc: 'AI coach asks what you shipped, reviews progress, and adjusts your roadmap. Like a mentor that never sleeps.',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
    span: '',
  },
];

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="features" className="py-24 px-6 relative" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="max-w-6xl mx-auto text-center mb-16">
        <ScrollReveal direction="up" delay={0}>
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'var(--color-bloom)', color: '#FFFFFF' }}
          >
            Features
          </span>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Everything you need to{' '}
            <span className="gradient-text-bloom">get hired</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            No more sending resumes into the void. One link. Verified proof from real work. Jobs that actually match your skills.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-4">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            className={feature.span || ''}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.05 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="card-base p-6 h-full">
              <div
                className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-4"
                style={{ background: feature.gradient, color: '#fff' }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                {feature.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
