'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

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
            <div className="badge-spark mb-6">AI Coach For Students</div>
          </ScrollReveal>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.04] tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            <ScrollReveal direction="up" delay={0.05} duration={0.8}>
              <span className="block">Your scattered</span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.12} duration={0.8}>
              <span className="block">work becomes</span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.2} duration={0.8}>
              <span className="relative inline-block">
                <span className="gradient-text-ember">career proof</span>
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
              GitHub, Kaggle, certificates, projects — all over the place. ORIN transforms them into verified proof cards, an AI coach who guides you daily, and real opportunities that match your proof.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4} duration={0.7}>
            <div className="flex gap-4 flex-wrap mb-8">
              <Link href="/signup" className="btn-primary text-base shine-wrap">
                Start Building Proof
              </Link>
              <button type="button" className="btn-outline text-base group">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Watch Demo
                </span>
              </button>
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

        {/* Right: Phone Mockup with parallax */}
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

function PhoneMockup() {
  return (
    <div className="relative h-[560px] flex items-center justify-center select-none">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[480px] h-[480px] rounded-full blur-3xl opacity-25 animate-pulse-slow"
          style={{
            background:
              'radial-gradient(circle, var(--color-spark) 0%, var(--color-ember) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* Floating cards */}
      <AICoachCard />
      <ProofScoreCard />
      <OpportunityCard />

      {/* Phone */}
      <div className="relative z-20 animate-float-slow">
        <div
          className="relative w-[268px] h-[540px] rounded-[3rem] shadow-2xl p-[6px]"
          style={{
            background:
              'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          }}
        >
          <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
          <div
            className="relative w-full h-full rounded-[2.4rem] overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <PhoneScreen />
          </div>
        </div>
      </div>
    </div>
  );
}

function AICoachCard() {
  return (
    <div
      className="absolute top-6 -left-2 md:-left-12 z-30 animate-float-slow"
      style={{ animationDelay: '0.5s' }}
    >
      <div
        className="rounded-2xl shadow-2xl p-3.5 max-w-[240px] flex items-start gap-3 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
          style={{
            background:
              'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
          }}
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
            <circle cx="9" cy="14" r="1.3" fill="currentColor" />
            <circle cx="15" cy="14" r="1.3" fill="currentColor" />
            <path d="M9.5 17.5h5" />
          </svg>
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white pulse-dot"
            style={{ backgroundColor: 'var(--color-ember)' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-bloom)' }}>
            AI Coach
          </p>
          <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--color-ink)' }}>
            Ship one live deploy this week. You are 80% there
          </p>
        </div>
      </div>
    </div>
  );
}

function ProofScoreCard() {
  return (
    <div
      className="absolute bottom-20 -right-2 md:-right-10 z-30 animate-float-slower"
      style={{ animationDelay: '1s' }}
    >
      <div
        className="rounded-2xl shadow-2xl p-3.5 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#FEF3C7" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="3"
                strokeDasharray="94.2"
                strokeDashoffset="94.2"
                strokeLinecap="round"
                className="progress-ring"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-ember)" />
                  <stop offset="100%" stopColor="var(--color-bloom)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--color-ink)' }}>
              88
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-ember)' }}>
              Proof Score
            </p>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>
              Top 8% of peers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard() {
  return (
    <div
      className="absolute top-1/2 -right-2 md:-right-14 z-30 animate-float-slow hidden lg:block"
      style={{ animationDelay: '1.5s' }}
    >
      <div
        className="rounded-2xl shadow-2xl p-3 max-w-[200px] backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm" style={{ color: 'var(--color-spark)' }}>
            &#10024;
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
            New Match
          </span>
        </div>
        <p className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--color-ink)' }}>
          Frontend Intern at Linear
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          92% match &middot; 2 days ago
        </p>
      </div>
    </div>
  );
}

function PhoneScreen() {
  return (
    <>
      <div
        className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-24 h-6 rounded-full flex items-center justify-end pr-3"
        style={{ backgroundColor: 'var(--color-ink)' }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
      </div>

      <div className="flex justify-between items-center px-5 pt-2.5 pb-1 text-[10px] font-semibold" style={{ color: 'var(--color-ink)' }}>
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <div className="w-5 h-2.5 border rounded-sm relative" style={{ borderColor: 'var(--color-ink)' }}>
            <div className="absolute inset-0.5 rounded-[1px]" style={{ backgroundColor: 'var(--color-ink)', width: '80%' }} />
          </div>
        </div>
      </div>

      <div
        className="px-4 pt-3 pb-3 h-[calc(100%-28px)] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-paper) 100%)',
        }}
      >
        <AppHeader />
        <HeroCard />
        <ProofCardItem
          iconBg="var(--color-bloom)"
          icon={
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z" />
            </svg>
          }
          title="AWS Certified"
          subtitle="Cloud Architect"
          delay="0.2s"
        />
        <ProofCardItem
          iconBg="var(--color-ink)"
          icon={
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          }
          title="GitHub: 24 repos"
          subtitle="React, Node, Python"
          delay="0.4s"
        />
        <ProofCardItem
          iconBg="var(--color-ember)"
          icon={<span className="text-sm font-bold text-white">DS</span>}
          title="Design System"
          subtitle="12 components shipped"
          delay="0.6s"
        />
        <BottomNav />
      </div>
    </>
  );
}

function AppHeader() {
  return (
    <div className="flex items-center justify-between mb-3 animate-slideInUp">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
          <Image src="/logo.png" alt="ORIN" width={48} height={48} className="object-contain w-full h-full" />
        </div>
        <div>
          <p className="text-[11px] font-bold leading-none" style={{ color: 'var(--color-ink)' }}>
            My Proof
          </p>
          <p className="text-[8px] font-semibold mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-bloom)' }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: 'var(--color-bloom)' }} />
            Live
          </p>
        </div>
      </div>
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
        <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </div>
    </div>
  );
}

function HeroCard() {
  return (
    <div
      className="relative rounded-2xl p-3 mb-2.5 shadow-lg overflow-hidden shine-wrap"
      style={{
        background: 'linear-gradient(135deg, var(--color-ink) 0%, #1a1a2e 100%)',
      }}
    >
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute -right-8 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--color-spark)' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-spark)' }}>
            Verified
          </span>
        </div>
        <p className="text-[11px] font-bold text-white leading-tight">Kaggle 1st Place</p>
        <p className="text-[9px] text-white/70 mt-0.5">ML Competition &middot; Top 0.3%</p>
        <div className="flex gap-1 mt-2">
          <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-semibold backdrop-blur-sm">
            Python
          </span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/20 text-white font-semibold backdrop-blur-sm">
            ML
          </span>
        </div>
      </div>
    </div>
  );
}

function ProofCardItem({ iconBg, icon, title, subtitle, delay }: { iconBg: string; icon: React.ReactNode; title: string; subtitle: string; delay: string }) {
  return (
    <div
      className="rounded-xl p-2.5 shadow-sm flex items-center gap-2.5 proof-card-anim"
      style={{
        animationDelay: delay,
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold leading-tight truncate" style={{ color: 'var(--color-ink)' }}>
          {title}
        </p>
        <p className="text-[8px] leading-tight" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      </div>
      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-bloom)' }}>
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </div>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="mt-2 mx-auto w-fit px-1.5 py-1 rounded-full flex items-center gap-1 shadow-lg" style={{ backgroundColor: 'var(--color-ink)' }}>
      <NavDot active />
      <NavDot />
      <NavDot />
      <NavDot />
    </div>
  );
}

function NavDot({ active }: { active?: boolean }) {
  return (
    <div
      className="h-1.5 rounded-full transition-all"
      style={{
        width: active ? '16px' : '6px',
        backgroundColor: active ? 'var(--color-bloom)' : '#555',
      }}
    />
  );
}
