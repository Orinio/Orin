import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const posts = [
  {
    title: 'Why "I know React" is not enough anymore',
    excerpt: 'The gap between claiming skills and proving them is growing. Here is how proof cards close it.',
    date: 'May 2026',
    category: 'Career Advice',
    readTime: '5 min read',
  },
  {
    title: 'How AI is changing the job search for students',
    excerpt: 'AI career coaches, automated verification, and skill matching — what actually works and what is hype.',
    date: 'April 2026',
    category: 'AI & Careers',
    readTime: '8 min read',
  },
  {
    title: 'Building your proof portfolio: a step-by-step guide',
    excerpt: 'From GitHub repos to certificates — how to turn your scattered work into a compelling career narrative.',
    date: 'March 2026',
    category: 'Guide',
    readTime: '10 min read',
  },
  {
    title: 'What recruiters actually look at (it is not your GPA)',
    excerpt: 'We talked to 50+ recruiters. Here is what they actually check when evaluating a candidate.',
    date: 'February 2026',
    category: 'Research',
    readTime: '7 min read',
  },
];

export default function BlogPage() {
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
            style={{ backgroundColor: 'var(--color-ember)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge-ember mb-6 animate-fadeInUp">Blog</div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            Ideas on proving your career
          </h1>
          <p
            className="text-lg max-w-xl mx-auto animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            Thoughts on career proof, AI coaching, and what it takes to stand out as a student.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-5">
            {posts.map((post, i) => (
              <article
                key={post.title}
                className="card-base p-7 group cursor-pointer animate-fadeInUp"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'var(--color-ember)', color: 'var(--color-paper)' }}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {post.date}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {post.readTime}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-2 group-hover:underline" style={{ color: 'var(--color-ink)' }}>
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {post.excerpt}
                </p>
                <div className="mt-4">
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                    style={{ color: 'var(--color-bloom)' }}
                  >
                    Read more
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 px-6"
        style={{ backgroundColor: 'var(--color-ink)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3 text-white">
            Start building your proof today
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-mist)' }}>
            Join 5,000+ students who stopped hoping and started proving.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-bloom)', color: 'white' }}
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
