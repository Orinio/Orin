'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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
    <section className="py-24 px-6 relative" style={{ backgroundColor: 'var(--color-ink)' }}>
      <div ref={ref} className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: 0.1 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="text-center p-6 rounded-[var(--radius-xl)]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight" style={{ color: stat.color }}>
                <AnimatedCounter
                  end={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={2.5}
                />
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
