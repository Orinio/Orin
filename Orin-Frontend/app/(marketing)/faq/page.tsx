import Link from 'next/link';

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
    a: 'Yes, Orin has a free tier that includes unlimited proof cards, public profile sharing, and basic analytics. A Pro plan with advanced features like custom domains and priority verification is coming soon.',
  },
  {
    q: 'Can I control who sees my proofs?',
    a: 'Absolutely. Each proof card has three visibility settings: Public (visible on your profile), Unlisted (accessible via link), and Private (only visible to you).',
  },
  {
    q: 'What types of sources can I connect?',
    a: 'You can add proofs from GitHub, Kaggle, certificates, hackathons, projects, blog posts, demos, or any custom source. More integrations are being added.',
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
    a: 'We use Supabase for secure authentication and data storage. Your private proofs are never shared, and you control what goes public.',
  },
  {
    q: 'What if I find a bug or have a feature request?',
    a: 'Reach out via the contact form or email us at support@orin.dev. We actively review feedback.',
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold font-serif">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-[var(--color-neutral-text-secondary)]">
          Everything you need to know about Orin.
        </p>
      </header>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] transition hover:border-[var(--color-neutral-border)]/80"
          >
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-[var(--color-neutral-text)]">
              {faq.q}
              <svg
                className="h-4 w-4 shrink-0 text-[var(--color-neutral-text-secondary)] transition group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="border-t border-[var(--color-neutral-border)] px-5 py-4 text-sm text-[var(--color-neutral-text-secondary)] leading-relaxed">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-6 text-center">
        <h2 className="text-lg font-semibold font-serif">Still have questions?</h2>
        <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
          We&apos;re here to help.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-lg bg-[var(--color-primary-emerald)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-emerald)]/90"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
