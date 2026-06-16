'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/home/ScrollReveal';

const painPoints = [
  { stat: '1:1,000', desc: 'Career advisor-to-student ratio at most universities' },
  { stat: '75%', desc: 'of resumes contain exaggerated or false skill claims' },
  { stat: '7.4s', desc: 'Average time recruiters spend scanning a resume' },
  { stat: '0', desc: 'Verification tools available to career services today' },
];

const benefits = [
  {
    title: 'Track verified career readiness',
    desc: 'See real-time proof scores for every student — not self-reported claims. Know who\'s job-ready and who needs help.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Scale career guidance with AI',
    desc: '1 advisor can\'t serve 1,000 students. Orin\'s AI coach gives personalized, proof-aware guidance to every student 24/7.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
        <circle cx="9" cy="14" r="1.3" fill="currentColor" />
        <circle cx="15" cy="14" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Accreditation-ready outcome data',
    desc: 'Export verified employment and skill data for accreditation boards. Real numbers, not survey responses.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    title: 'Competitive differentiator',
    desc: '"Our students have verified proof portfolios" is a powerful message to prospective students and their families.',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
];

const features = [
  'Real-time career readiness dashboard',
  'Bulk cohort onboarding (500+ students)',
  'AI-proof verification for every student',
  'Skill gap analysis per cohort',
  'Employment outcome tracking',
  'Exportable reports for accreditation',
  'Branded proof portfolios with university logo',
  'Dedicated support and onboarding',
];

export default function UniversitiesPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="up" delay={0}>
            <div className="badge-bloom mb-6">For Career Services</div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h1
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight"
              style={{ color: 'var(--color-ink)' }}
            >
              You have 1 advisor<br />
              <span className="gradient-text-bloom">for 1,000 students.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Orin gives career services offices a dashboard that tracks verified student outcomes, scales guidance with AI, and produces accreditation-ready data — all in one place.
            </p>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.3}>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/contact?plan=university" className="btn-primary text-base shine-wrap">
                Book a Demo
              </Link>
              <a href="#pricing" className="btn-outline text-base">
                View Pricing
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pain point stats */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-ink)' }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {painPoints.map((point, i) => (
            <motion.div
              key={point.stat}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--color-ember)' }}>
                {point.stat}
              </div>
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {point.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <div className="badge-bloom mb-6">Why Career Services Choose Orin</div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-8 mt-10">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="card-base p-8 h-full glow-border card-accent-bottom group">
                  <div
                    className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)', color: '#fff' }}
                  >
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                    {benefit.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
                    {benefit.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How the pilot works */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <div className="badge-ember mb-6">How the Pilot Works</div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10" style={{ color: 'var(--color-ink)' }}>
              6 months free.<br />
              <span className="gradient-text-ember">No strings attached.</span>
            </h2>
          </ScrollReveal>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Intro call', desc: '30-minute call with your career services team. We understand your needs and set up your dashboard.' },
              { step: '02', title: 'Cohort import', desc: 'We bulk-import your next student cohort (200-500 students). They get pre-created profiles ready to connect.' },
              { step: '03', title: 'Embed in curriculum', desc: 'We work with you to embed Orin into your existing career readiness program. Not a separate tool — an integrated layer.' },
              { step: '04', title: 'Review outcomes', desc: 'After 3 months, review student engagement, proof scores, and career readiness metrics. Decide if it\'s working.' },
              { step: '05', title: 'Convert or cancel', desc: 'After 6 months: convert to a paid plan or cancel. No lock-in, no penalties. We earn your business.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex items-start gap-5"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow"
                  style={{ background: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)', color: '#fff' }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-ink)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* University Dashboard Features */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-4xl mx-auto">
          <ScrollReveal direction="up" delay={0}>
            <div className="badge-ink mb-6">What You Get</div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10" style={{ color: 'var(--color-ink)' }}>
              University Dashboard Features
            </h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)]"
                style={{ backgroundColor: 'var(--color-paper)', border: '1px solid var(--color-border)' }}
              >
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ backgroundColor: 'var(--color-ink)' }}>
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            University Plan
          </h2>
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-6xl font-bold text-white">$99</span>
            <span className="text-sm text-white/50">/month</span>
          </div>
          <p className="text-base mb-8 text-white/70">
            Unlimited students. Full dashboard. Accreditation-ready data. Or pilot free for 6 months.
          </p>
          <Link href="/contact?plan=university" className="btn-primary text-lg px-10 py-4 shine-wrap inline-flex">
            Book a Demo
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center" style={{ color: 'var(--color-ink)' }}>
            Common Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'We already use Handshake. Is this competing?',
                a: 'No. Handshake is a job board. Orin is a verification layer. They\'re complementary — students find jobs on Handshake, prove their skills on Orin.',
              },
              {
                q: 'Students won\'t use another platform.',
                a: 'We embed Orin into your existing career readiness curriculum. It\'s not optional — it\'s how you track their progress. Students use it because it directly helps them get hired.',
              },
              {
                q: 'Is student data safe?',
                a: 'We use read-only OAuth for all integrations. We never write to connected accounts. All data is encrypted at rest. Supabase RLS ensures students only see their own data. FERPA-compliant.',
              },
              {
                q: 'What if it doesn\'t work for our students?',
                a: 'That\'s what the 6-month free pilot is for. If students don\'t engage or you don\'t see value, you owe nothing. No lock-in.',
              },
              {
                q: 'How is this different from our LMS?',
                a: 'Your LMS tracks coursework. Orin tracks real-world work — GitHub repos, competition results, certificates, projects. It proves skills beyond the classroom.',
              },
            ].map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="card-base p-6"
              >
                <h3 className="text-base font-bold mb-2" style={{ color: 'var(--color-ink)' }}>{faq.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
