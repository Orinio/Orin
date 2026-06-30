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

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] pt-28 pb-20 px-6 overflow-hidden flex items-center"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
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
            <span
              className="inline-block text-[11px] font-bold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'var(--color-spark)', color: 'var(--color-ink)' }}
            >
              Career proof for builders
            </span>
          </ScrollReveal>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.04] tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            <ScrollReveal direction="up" delay={0.05} duration={0.8}>
              <span className="block">Stop collecting</span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.12} duration={0.8}>
              <span className="block">certificates.</span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2} duration={0.8}>
              <span className="relative inline-block">
                <span className="gradient-text-ember">Start getting hired</span>
              </span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.28} duration={0.8}>
              <span className="block">for what you built.</span>
            </ScrollReveal>
          </h1>

          <ScrollReveal direction="up" delay={0.35} duration={0.7}>
            <p
              className="text-lg mb-8 leading-relaxed max-w-lg"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Six repos. Three PDFs. A Kaggle notebook you forgot about.
              ORIN turns your scattered work into verified proof recruiters
              actually trust — and tells you what to build next.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.45} duration={0.7}>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-[var(--radius-md)] text-base transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-pulse)',
                  color: '#FFFFFF',
                  boxShadow: 'var(--shadow-colored-pulse)',
                }}
              >
                Start Building Proof — Free
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-[var(--radius-md)] text-base border-2 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  borderColor: 'var(--color-border-strong)',
                  color: 'var(--color-ink)',
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Try Instant Demo
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <div className="order-2">
          <PhoneMockup />
        </div>
      </motion.div>
    </section>
  );
}
