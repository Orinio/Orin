'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ScrollReveal from './ScrollReveal';
import PhoneMockup from './hero/PhoneMockup';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] pt-32 pb-24 px-6 overflow-hidden grain-overlay flex items-center"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* Ambient orbs with parallax */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.06]"
          style={{ backgroundColor: 'var(--color-spark)', y }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.04]"
          style={{ backgroundColor: 'var(--color-ember)', y: useTransform(scrollYProgress, [0, 1], ['0%', '15%']) }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full blur-[80px] opacity-[0.03]"
          style={{ backgroundColor: 'var(--color-bloom)', y: useTransform(scrollYProgress, [0, 1], ['0%', '20%']) }}
        />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10 w-full"
        style={{ opacity, scale }}
      >
        {/* Left: Copy */}
        <div className="order-1">
          <ScrollReveal direction="up" delay={0}>
            <div className="badge-spark mb-6">Get Hired For What You Built</div>
          </ScrollReveal>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.04] tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            <ScrollReveal direction="up" delay={0.05} duration={0.8}>
              <span className="block">Get hired for what</span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.12} duration={0.8}>
              <span className="block">you've actually</span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2} duration={0.8}>
              <span className="relative inline-block">
                <span className="gradient-text-ember">built</span>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 w-full h-3 -z-10 rounded-sm"
                  style={{ backgroundColor: 'var(--color-spark)', opacity: 0.4 }}
                />
              </span>
            </ScrollReveal>
          </h1>

          <ScrollReveal direction="up" delay={0.3} duration={0.7}>
            <p
              className="text-lg mb-8 leading-relaxed max-w-lg"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              You've built real projects on GitHub, won competitions, earned certificates. Recruiters can't see any of it. ORIN turns your work into verified proof they can actually trust — and tells you exactly what to build next.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4} duration={0.7}>
            <div className="flex gap-4 flex-wrap mb-8">
              <Link href="/signup" className="btn-primary text-base shine-wrap">
                Start Building Proof — Free
              </Link>
              <Link href="/demo" className="btn-outline text-base group">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Try Instant Demo
                </span>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.5} duration={0.7}>
            <div className="flex items-center gap-6 flex-wrap">
              {[
                'Free forever tier',
                'No card needed',
                '5,000+ active students',
              ].map((text) => (
                <span
                  key={text}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: 'var(--color-bloom)', color: '#fff' }}
                  >
                    ✓
                  </span>
                  {text}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <div className="order-2">
          <PhoneMockup />
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }}>
          Scroll
        </span>
        <motion.div
          className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
          style={{ borderColor: 'var(--color-border-strong)', opacity: 0.4 }}
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-ink)', opacity: 0.3 }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
