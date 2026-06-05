'use client';

const painPoints = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Tab chaos',
    desc: 'Six repos, three PDFs, a Notion doc, and that Kaggle notebook you forgot about.',
    color: 'var(--color-ember)',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #e53e3e 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    title: 'Proof feels scattered',
    desc: 'Hard to show employers what you can actually do when your work is everywhere.',
    color: 'var(--color-pulse)',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    title: 'No guidance',
    desc: 'You built things but have no idea what to build next to stand out.',
    color: 'var(--color-spark)',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function Problem() {
  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(246,146,38,0.03)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.04]" style={{ backgroundColor: 'var(--color-pulse)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-ember)' }} />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left */}
          <div className="animate-fadeInLeft">
            <div className="inline-block badge-pulse mb-6 animate-pulse">
              The Problem
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight tracking-tight animate-fadeInUp" style={{ color: 'var(--color-ink)' }}>
              You built a lot.<br />
              <span className="relative inline-block">
                Showing it is impossible.
                <span className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm animate-pulse" style={{ backgroundColor: 'var(--color-pulse)', opacity: 0.3 }} />
              </span>
            </h2>
            <p className="text-lg leading-relaxed animate-fadeInUp" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
              Every student has proof of their skills — scattered across GitHub, Notion, Google Drive, and email.
              None of it connects. None of it tells a story.
            </p>
          </div>

          {/* Right: Pain points */}
          <div className="space-y-5 animate-fadeIn">
            {painPoints.map((point, i) => (
              <div
                key={point.title}
                className="card-base p-6 flex items-start gap-4 hover-lift animate-fadeInUp hover:scale-105 transition-transform"
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  background: 'linear-gradient(135deg, var(--color-surface) 0%, #fafafa 100%)'
                }}
              >
                <div
                  className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center flex-shrink-0 shadow-lg hover-lift transition-transform hover:scale-110"
                  style={{ 
                    background: point.gradient,
                    color: '#fff',
                    boxShadow: `0 4px 12px rgba(238, 66, 102, 0.15)`
                  }}
                >
                  {point.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-1 hover-lift" style={{ color: 'var(--color-ink)' }}>{point.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{point.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
