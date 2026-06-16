'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ScrollReveal from './ScrollReveal';
import AnimatedCounter from './AnimatedCounter';

const stats = [
  { value: 5240, suffix: '+', label: 'Students getting hired', color: 'var(--color-bloom)' },
  { value: 18300, suffix: '', label: 'Proof cards linked to real work', color: 'var(--color-ember)' },
  { value: 88, suffix: '%', label: 'Feel more career-ready', color: 'var(--color-pulse)' },
  { value: 4.9, suffix: '/5', label: 'Student satisfaction', color: 'var(--color-spark)', decimals: 1 },
];

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="py-32 px-6 relative overflow-hidden noise-overlay" style={{ backgroundColor: 'var(--color-ink)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ backgroundColor: 'var(--color-spark)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.04]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>

      <div ref={ref} className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.1 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className="text-center p-8 rounded-[var(--radius-xl)] backdrop-blur-md"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="text-5xl md:text-6xl font-bold mb-3 tracking-tight" style={{ color: stat.color }}>
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={2.5}
                />
              </div>
              <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
