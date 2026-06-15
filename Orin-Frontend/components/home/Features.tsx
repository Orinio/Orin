'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', willChange: 'transform' }}
    >
      {children}
    </div>
  );
}

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
    desc: 'Auto-generated cards from your work, verified with links to the source. Every project, cert, and contribution becomes tangible proof.',
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
    title: 'Proof Score',
    desc: 'A real measure of your career readiness. Track weekly trends and see where you rank among peers.',
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
    <section id="features" className="py-32 px-6 relative overflow-hidden grain-overlay" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-bloom)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.02]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>

      <div className="max-w-6xl mx-auto text-center mb-20 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-bloom mb-6">Features</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Everything you need to{' '}
            <span className="gradient-text-bloom">prove it</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            No more sending PDFs and hoping they open them. One link. Verified proof. Real results.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-5 relative z-10">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            className={feature.span || ''}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.05 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <TiltCard>
              <div className="card-base p-8 h-full group glow-border card-accent-bottom">
                <div
                  className="w-14 h-14 rounded-[var(--radius-xl)] flex items-center justify-center mb-5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl"
                  style={{ background: feature.gradient, color: '#fff' }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--color-ink)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                  {feature.desc}
                </p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
