'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

const testimonials = [
  {
    quote: 'ORIN turned my messy GitHub into something recruiters actually want to look at. Got my internship offer within a month.',
    name: 'Priya Mehta',
    role: 'CS Sophomore, UIUC',
    avatar: 'PM',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    quote: 'The AI coach is like having a career advisor who actually knows my work. "Ship this, fix that" — direct and useful.',
    name: 'James Rodriguez',
    role: 'ML Student, Stanford',
    avatar: 'JR',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    quote: 'My proof score went from 42 to 88 in three weeks. The daily check-ins kept me accountable.',
    name: 'Aisha Williams',
    role: 'Data Science Junior, MIT',
    avatar: 'AW',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    quote: 'I used to send PDF resumes. Now I send one ORIN link. Way more professional, and they can actually verify my projects.',
    name: 'Chen Wei',
    role: 'Full-Stack Developer, UC Berkeley',
    avatar: 'CW',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-32 px-6 relative overflow-hidden grain-overlay" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>

      <div className="max-w-6xl mx-auto text-center mb-20 relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-ink mb-6">Testimonials</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-5" style={{ color: 'var(--color-ink)' }}>
            Students love <span className="gradient-text-ember">ORIN</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
            Join 5,000+ students building verified career proof.
          </p>
        </ScrollReveal>
      </div>

      <div ref={ref} className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6 relative z-10">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.05 + i * 0.1,
              ease: [0.16,1,0.3,1]
            }}
          >
            <div className="card-base p-8 h-full glow-border card-accent-bottom hover-lift">
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[0, 1, 2, 3, 4].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5"
                    style={{ color: 'var(--color-spark)' }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              {/* Quote */}
              <p className="text-base mb-8 leading-relaxed font-serif italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.85 }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              {/* Attribution */}
              <div className="flex items-center gap-4 mt-auto pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white"
                  style={{ background: t.gradient, color: '#fff' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>{t.role}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
