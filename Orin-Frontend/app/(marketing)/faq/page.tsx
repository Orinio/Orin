import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    q: 'What is Orin?',
    a: 'Orin is a career proof platform that helps students and professionals turn their work — from GitHub repos to hackathon wins — into verified, shareable proof of skills.',
  },
  {
    q: 'How does verification work?',
    a: 'When you add a proof card, it starts as "pending." Our system or a reviewer checks the source (e.g., the GitHub repo or certificate) and marks it as "verified" if everything checks out.',
  },
  {
    q: 'Is Orin free?',
    a: 'Yes, Orin has a free tier that includes unlimited proof cards, public profile sharing, and basic analytics. A Pro plan with advanced features like cloud storage connectors and AI coaching is available.',
  },
  {
    q: 'Can I control who sees my proofs?',
    a: 'Absolutely. Each proof card has three visibility settings: Public (visible on your profile), Unlisted (accessible via link), and Private (only visible to you).',
  },
  {
    q: 'What types of sources can I connect?',
    a: 'You can add proofs from GitHub, Kaggle, certificates, hackathons, projects, blog posts, demos, or any custom source. With Pro, you can also connect Google Drive, Dropbox, OneDrive, and Notion.',
  },
  {
    q: 'How do recruiters find my profile?',
    a: 'Your public profile is accessible at orin.dev/your-username. You can share the link directly, or recruiters may discover you through skill-based search.',
  },
  {
    q: 'Can I edit or delete a proof after adding it?',
    a: 'Yes, you can edit details (title, description, skills) or soft-delete a proof card from your dashboard at any time.',
  },
  {
    q: 'How is my data protected?',
    a: 'We use Supabase for secure authentication and data storage. Cloud integrations use OAuth read-only access. We never write to your connected accounts. Your private proofs are never shared.',
  },
  {
    q: 'How does the AI coach work?',
    a: 'Our AI coach analyzes your proof cards and provides personalized daily guidance — like "you are 80% ready for this role, ship one live deploy this week." It adapts to your actual work, not generic advice.',
  },
  {
    q: 'What if I find a bug or have a feature request?',
    a: 'Reach out via the contact form or email us at support@orin.dev. We actively review feedback.',
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-28 pb-16 px-6"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-[0.07] animate-pulse-slow"
            style={{ backgroundColor: 'var(--color-spark)' }}
          />
          <div
            className="absolute bottom-10 right-10 w-80 h-80 rounded-full blur-3xl opacity-[0.05] animate-pulse-slower"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-spark mb-6 animate-fadeInUp">FAQ</div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            Frequently asked questions
          </h1>
          <p
            className="text-lg max-w-xl mx-auto animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            Everything you need to know about Orin.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-[var(--radius-lg)] border overflow-hidden animate-fadeInUp"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)', animationDelay: `${0.1 + i * 0.04}s` }}
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                <span className="text-sm font-semibold pr-4" style={{ color: 'var(--color-ink)' }}>{faq.q}</span>
                <span
                  className="text-lg transition-transform group-open:rotate-45 flex-shrink-0"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="card-base p-8">
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
              Still have questions?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              We are here to help. Reach out and we will get back to you within 24 hours.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
              style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
            >
              Contact us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
