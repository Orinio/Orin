const testimonials = [
  {
    quote: 'ORIN turned my messy GitHub into something recruiters actually want to look at. Got my internship offer within a month.',
    name: 'Priya Mehta',
    role: 'CS Sophomore, UIUC',
    color: 'var(--color-bloom)',
    avatar: 'PM',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    quote: 'The AI coach is like having a career advisor who actually knows my work. "Ship this, fix that" — direct and useful.',
    name: 'James Rodriguez',
    role: 'ML Student, Stanford',
    color: 'var(--color-ember)',
    avatar: 'JR',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    quote: 'My proof score went from 42 to 88 in three weeks. The daily check-ins kept me accountable.',
    name: 'Aisha Williams',
    role: 'Data Science Junior, MIT',
    color: 'var(--color-pulse)',
    avatar: 'AW',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    quote: 'I used to send PDF resumes. Now I send one ORIN link. Way more professional, and they can actually verify my projects.',
    name: 'Chen Wei',
    role: 'Full-Stack Developer, UC Berkeley',
    color: 'var(--color-spark)',
    avatar: 'CW',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(238,66,102,0.02)_0%,transparent_70%)]" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>
      
      <div className="max-w-6xl mx-auto text-center mb-14 relative z-10">
        <div className="inline-block badge-ink mb-6 animate-pulse">Testimonials</div>
        <h2 className="text-4xl font-bold tracking-tight mb-4 animate-fadeInUp" style={{ color: 'var(--color-ink)' }}>
          Students love{' '}
          <span className="relative inline-block">
            ORIN
            <span className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm animate-pulse" style={{ backgroundColor: 'var(--color-spark)', opacity: 0.4 }} />
          </span>
        </h2>
        <p className="text-lg max-w-2xl mx-auto animate-fadeInUp" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
          Join 5,000+ students building verified career proof.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-5 relative z-10">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            className="card-base p-7 hover-lift animate-fadeInUp hover:scale-105 transition-transform"
            style={{ 
              animationDelay: `${i * 0.05}s`,
              background: 'linear-gradient(135deg, var(--color-surface) 0%, #fafafa 100%)'
            }}
          >
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-5 h-5 animate-pulse" style={{ color: 'var(--color-spark)' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ))}
            </div>
            <p className="text-sm mb-6 leading-relaxed italic" style={{ color: 'var(--color-text-secondary)' }}>
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg group-hover-lift transition-transform hover:scale-110"
                style={{ 
                  background: t.gradient, 
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              >
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-bold group-hover-lift" style={{ color: 'var(--color-ink)' }}>{t.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
