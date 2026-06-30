'use client';

import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function FinalCTA() {
  return (
    <section className="py-24 px-6 relative" style={{ backgroundColor: 'var(--color-ink)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal direction="up" delay={0}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight text-white">
            Stop collecting certificates.<br />
            <span className="gradient-text-ember">Start getting hired for what you built.</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.1}>
          <p className="text-lg mb-8 text-white/60 max-w-xl mx-auto">
            Join 5,000+ students who turned their real work into proof recruiters trust. Free forever.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-[var(--radius-md)] text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-pulse)',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-colored-pulse)',
            }}
          >
            Build Your Proof — Free
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
