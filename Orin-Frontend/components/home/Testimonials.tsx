const testimonials = [
  {
    quote:
      'ORIN turned my messy GitHub into something recruiters actually want to look at. Got my internship offer within a month.',
    name: 'Priya Mehta',
    role: 'CS Sophomore, UIUC',
    avatar: 'PM',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    quote:
      'The AI coach is like having a career advisor who actually knows my work. "Ship this, fix that" — direct and useful.',
    name: 'James Rodriguez',
    role: 'ML Student, Stanford',
    avatar: 'JR',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    quote:
      'My proof score went from 42 to 88 in three weeks. The daily check-ins kept me accountable.',
    name: 'Aisha Williams',
    role: 'Data Science Junior, MIT',
    avatar: 'AW',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    quote:
      'I used to send PDF resumes. Now I send one ORIN link. Way more professional, and they can actually verify my projects.',
    name: 'Chen Wei',
    role: 'Full-Stack Developer, UC Berkeley',
    avatar: 'CW',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function Testimonials() {
  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* Soft background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]"
          style={{ backgroundColor: 'var(--color-pulse)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center mb-14 relative z-10">
        <div className="badge-ink mb-6 animate-fadeInUp">Testimonials</div>
        <h2
          className="text-4xl font-bold tracking-tight mb-4 animate-fadeInUp"
          style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
        >
          Students love{' '}
          <span className="relative inline-block">
            ORIN
            <span
              aria-hidden="true"
              className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm"
              style={{ backgroundColor: 'var(--color-spark)', opacity: 0.4 }}
            />
          </span>
        </h2>
        <p
          className="text-lg max-w-2xl mx-auto animate-fadeInUp"
          style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
        >
          Join 5,000+ students building verified career proof.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-5 relative z-10">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            className="card-base p-7 animate-fadeInUp"
            style={{ animationDelay: `${0.1 + i * 0.06}s` }}
          >
            <div className="flex gap-1 mb-4">
              {[0, 1, 2, 3, 4].map((star) => (
                <svg
                  key={star}
                  className="w-5 h-5"
                  style={{ color: 'var(--color-spark)' }}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
            <p
              className="text-sm mb-6 leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
                style={{ background: t.gradient, color: '#fff' }}
              >
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                  {t.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {t.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
