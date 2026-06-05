import Link from 'next/link';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen antialiased" style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}>
      {/* Header */}
      <nav className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-ink)] transition-transform group-hover:scale-105">
              <span className="text-base font-bold" style={{ color: 'var(--color-spark)' }}>O</span>
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-ink)' }}>
              ORIN
            </span>
          </Link>
          <div className="hidden items-center gap-2 text-sm sm:flex" style={{ color: 'var(--color-text-secondary)' }}>
            <svg className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span>Trusted by 10,000+ builders</span>
          </div>
        </div>
      </nav>

      {/* Main split layout */}
      <main
        id="main-content"
        className="grid min-h-[calc(100vh-73px)] lg:grid-cols-2"
      >
        {/* Left side — Brand showcase */}
        <section className="relative hidden overflow-hidden lg:block" style={{ backgroundColor: 'var(--color-paper)' }}>
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-32 top-20 h-96 w-96 rounded-full blur-3xl opacity-[0.07]" style={{ backgroundColor: 'var(--color-spark)' }} />
            <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full blur-3xl opacity-[0.05]" style={{ backgroundColor: 'var(--color-ember)' }} />
            <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-[0.04]" style={{ backgroundColor: 'var(--color-pulse)' }} />
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
              }}
            />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
            <div className="space-y-10">
              {/* Badge */}
              <div className="badge-spark inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: 'var(--color-bloom)' }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }} />
                </span>
                New: AI-powered proof suggestions
              </div>

              {/* Headline */}
              <div className="space-y-5">
                <h1 className="text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
                  Turn your work into{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10">career proof</span>
                    <span className="absolute bottom-1.5 left-0 h-3 w-full rounded-sm -z-10" style={{ backgroundColor: 'var(--color-spark)', opacity: 0.5 }} />
                  </span>
                </h1>
                <p className="max-w-md text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  GitHub commits, Kaggle notebooks, certificates, design files — all become verified proof cards that prove your skills to recruiters.
                </p>
              </div>

              {/* Feature checklist */}
              <ul className="space-y-3.5">
                {[
                  'Auto-import from GitHub, Kaggle & more',
                  'Beautiful, shareable proof portfolio',
                  'Verified, tamper-proof credentials',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-bloom)' }}>
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[15px]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial card */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl opacity-60 blur-lg" style={{ background: 'linear-gradient(135deg, var(--color-pulse), var(--color-ember))' }} />
              <div className="relative rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-start gap-1" style={{ color: 'var(--color-spark)' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  &ldquo;Orin helped me land 3 interviews in a week. Recruiters could actually <em>see</em> what I&rsquo;d built, not just read about it.&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--color-pulse), var(--color-ember))' }}>
                    SM
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Sarah Mitchell</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Frontend Engineer @ Vercel</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right side — Auth forms */}
        <section className="relative flex items-center justify-center px-6 py-12 sm:px-8" style={{ backgroundColor: 'var(--color-surface)' }}>
          {/* Mobile background orbs */}
          <div className="absolute inset-0 -z-10 overflow-hidden lg:hidden">
            <div className="absolute -left-32 top-20 h-72 w-72 rounded-full blur-3xl opacity-[0.06]" style={{ backgroundColor: 'var(--color-spark)' }} />
            <div className="absolute -right-32 bottom-20 h-72 w-72 rounded-full blur-3xl opacity-[0.04]" style={{ backgroundColor: 'var(--color-ember)' }} />
          </div>
          <div className="w-full max-w-md">{children}</div>
        </section>
      </main>
    </div>
  );
}
