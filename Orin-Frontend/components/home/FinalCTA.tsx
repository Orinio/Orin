'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="py-32 px-6 relative overflow-hidden noise-overlay" style={{ backgroundColor: 'var(--color-ink)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.06] animate-pulse-slow" style={{ backgroundColor: 'var(--color-spark)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.04] animate-pulse-slower" style={{ backgroundColor: 'var(--color-ember)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-[0.03] animate-float" style={{ backgroundColor: 'var(--color-bloom)' }} />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <ScrollReveal direction="up" delay={0}>
          <div className="badge-spark mb-8">Ready?</div>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight tracking-tight text-white">
            Stop collecting certificates.<br />
            <span className="gradient-text-ember">Start getting hired for what you built.</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <p className="text-lg md:text-xl mb-10 text-white/70 max-w-xl mx-auto">
            Join 5,000+ students who turned their real work into proof recruiters trust. Free forever.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.3}>
          <Link href="/signup" className="btn-primary text-lg px-10 py-4 shine-wrap inline-flex">
            Build Your Proof — Free
          </Link>
        </ScrollReveal>

        {/* Social proof numbers */}
        <motion.div
          ref={ref}
          className="mt-16 pt-10 flex items-center justify-center gap-8 md:gap-16 flex-wrap"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {[
            { val: '5,000+', label: 'Students' },
            { val: '18,000+', label: 'Proof cards' },
            { val: '99%', label: 'Would recommend' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{s.val}</div>
              <div className="text-xs text-white/50 uppercase tracking-wider font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
