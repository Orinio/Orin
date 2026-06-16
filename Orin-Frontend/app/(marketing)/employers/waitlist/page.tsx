'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/home/ScrollReveal';

const reasons = [
  { icon: '&#9733;', stat: '75%', desc: 'of resumes contain exaggerated skill claims' },
  { icon: '&#9201;', stat: '1-2hrs', desc: 'wasted per candidate screening unverifiable skills' },
  { icon: '&#10060;', stat: '0', desc: 'verified skill data available in most ATS systems today' },
];

const benefits = [
  {
    title: 'Search verified talent',
    desc: 'Every candidate on Orin has skill confidence scores backed by real work on GitHub, Kaggle, and certificates.',
  },
  {
    title: 'Skip resume keyword bingo',
    desc: 'No more "proficient in Python" with no proof. See actual projects, commit history, and competition results.',
  },
  {
    title: 'Reduce false positives',
    desc: 'Stop interviewing candidates who exaggerated skills. Orin\'s verification catches what resumes can\'t.',
  },
  {
    title: 'Save screening time',
    desc: 'Proof Cards replace 30-minute phone screens. See a candidate\'s real work before you ever book a call.',
  },
];

export default function EmployersWaitlistPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    hiringVolume: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // In production, this would POST to a waitlist endpoint
    // For now, store in localStorage and show success
    try {
      const existing = JSON.parse(localStorage.getItem('orin_employer_waitlist') || '[]');
      existing.push({ ...form, timestamp: new Date().toISOString() });
      localStorage.setItem('orin_employer_waitlist', JSON.stringify(existing));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up" delay={0}>
            <div className="badge-ember mb-6">For Employers</div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h1
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
              style={{ color: 'var(--color-ink)' }}
            >
              Stop screening candidates<br />
              <span className="gradient-text-ember">who exaggerate skills.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Orin gives you access to students with verified, source-linked proof of their skills. Not self-reported claims — actual projects, real commit history, scored confidence levels.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-ink)' }}>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.stat}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--color-ember)' }}>
                {reason.stat}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {reason.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center" style={{ color: 'var(--color-ink)' }}>
              What you'll get
            </h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card-base p-6 glow-border card-accent-bottom"
              >
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-ink)' }}>{benefit.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-lg mx-auto">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-base p-10 text-center glow-border"
            >
              <div className="text-5xl mb-4">&#10003;</div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-ink)' }}>
                You're on the list
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                We'll reach out when the employer portal is ready. Expect early access in the next few months.
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                Added {form.email} from {form.company}
              </p>
            </motion.div>
          ) : (
            <>
              <ScrollReveal direction="up" delay={0}>
                <div className="badge-ember mb-6">Join the Waitlist</div>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.1}>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
                  Get early access
                </h2>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.2}>
                <p className="text-base mb-8" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                  The employer portal is launching soon. Join the waitlist for early access and priority pricing.
                </p>
              </ScrollReveal>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[var(--radius-lg)] text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[var(--radius-lg)] text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                    Company
                  </label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[var(--radius-lg)] text-sm outline-none transition-all focus:ring-2"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                    Your role
                  </label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[var(--radius-lg)] text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                  >
                    <option value="">Select your role</option>
                    <option value="recruiter">Recruiter / Talent Acquisition</option>
                    <option value="hiring-manager">Hiring Manager</option>
                    <option value="engineering-lead">Engineering Lead</option>
                    <option value="hr">HR / People Ops</option>
                    <option value="founder">Founder / CEO</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-ink)' }}>
                    How many developers do you hire per year?
                  </label>
                  <select
                    required
                    value={form.hiringVolume}
                    onChange={(e) => setForm(f => ({ ...f, hiringVolume: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[var(--radius-lg)] text-sm outline-none transition-all"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                  >
                    <option value="">Select volume</option>
                    <option value="1-5">1-5</option>
                    <option value="6-20">6-20</option>
                    <option value="21-50">21-50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-base mt-4 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join the Waitlist'}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
