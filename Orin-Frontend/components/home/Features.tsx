const features = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: 'Proof Cards',
    desc: 'Auto-generated cards from your work, verified with links to the source. Every project, cert, and contribution becomes tangible proof.',
    color: 'var(--color-bloom)',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
    highlight: 'bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-100'
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v1H7a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V8a2 2 0 0 0-2-2h-2V5a3 3 0 0 0-3-3z" />
        <circle cx="9" cy="14" r="1.3" fill="currentColor" />
        <circle cx="15" cy="14" r="1.3" fill="currentColor" />
      </svg>
    ),
    title: 'AI Coach',
    desc: 'Daily nudges based on your actual proof. "You are 80% ready for X role — ship one live deploy this week."',
    color: 'var(--color-ink)',
    gradient: 'linear-gradient(135deg, var(--color-ink) 0%, #2d3748 100%)',
    highlight: 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100'
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: 'Job Board',
    desc: 'Internships and roles matched to YOUR proof. Not random listings — opportunities where your skills are the exact fit.',
    color: 'var(--color-ember)',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
    highlight: 'bg-gradient-to-br from-orange-50 to-amber-50 border-amber-100'
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    title: 'Public Profile',
    desc: 'Shareable link: yourname.orin.dev. Clean, verified, and way more credible than a raw GitHub page.',
    color: 'var(--color-pulse)',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
    highlight: 'bg-gradient-to-br from-rose-50 to-pink-50 border-pink-100'
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Proof Score',
    desc: 'A real measure of your career readiness. Track weekly trends and see where you rank among peers.',
    color: 'var(--color-spark)',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
    highlight: 'bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-100'
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Daily Check-ins',
    desc: 'AI coach asks what you shipped, reviews progress, and adjusts your roadmap. Like a mentor that never sleeps.',
    color: 'var(--color-bloom)',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
    highlight: 'bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-100'
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(11,171,119,0.02)_0%,transparent_70%)]" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-bloom)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.02]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>
      
      <div className="max-w-6xl mx-auto text-center mb-14 relative z-10">
        <div className="inline-block badge-bloom mb-6 animate-pulse">Features</div>
        <h2 className="text-4xl font-bold tracking-tight mb-4 animate-fadeInUp" style={{ color: 'var(--color-ink)' }}>
          Everything you need to{' '}
          <span className="relative inline-block">
            prove it
            <span className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm animate-pulse" style={{ backgroundColor: 'var(--color-spark)', opacity: 0.4 }} />
          </span>
        </h2>
        <p className="text-lg max-w-2xl mx-auto animate-fadeInUp" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
          No more sending PDFs and hoping they open them. One link. Verified proof. Real results.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`card-base p-7 hover-lift group ${feature.highlight} animate-fadeInUp hover:scale-105 transition-transform`}
            style={{ 
              animationDelay: `${i * 0.05}s`,
              background: 'linear-gradient(135deg, var(--color-surface) 0%, #fafafa 100%)'
            }}
          >
            <div
              className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg"
              style={{ 
                background: feature.gradient, 
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover-lift" style={{ color: 'var(--color-ink)' }}>{feature.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
