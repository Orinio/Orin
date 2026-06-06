import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-ink)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.08] animate-pulse-slow"
          style={{ backgroundColor: 'var(--color-spark)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06] animate-pulse-slower"
          style={{ backgroundColor: 'var(--color-ember)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-[0.04] animate-float"
          style={{ backgroundColor: 'var(--color-bloom)' }}
        />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="badge-spark mb-6 animate-fadeInUp">Ready?</div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight text-white animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          Stop collecting certificates.
          <br />
          <span className="relative inline-block">
            Start collecting proof.
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 left-0 w-full h-3 -z-10 rounded-sm"
              style={{ backgroundColor: 'var(--color-spark)', opacity: 0.5 }}
            />
          </span>
        </h2>
        <p
          className="text-lg mb-8 text-white/70 max-w-xl mx-auto animate-fadeInUp"
          style={{ animationDelay: '0.2s' }}
        >
          Join 5,000+ students who turned scattered work into verified career proof. Free forever.
        </p>
        <Link
          href="/signup"
          className="btn-primary text-base animate-fadeInUp"
          style={{ animationDelay: '0.3s' }}
        >
          Build Your Proof — Free
        </Link>
      </div>
    </section>
  );
}
