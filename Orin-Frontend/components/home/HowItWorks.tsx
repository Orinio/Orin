const steps = [
  {
    num: '01',
    title: 'Connect your sources',
    desc: 'Link GitHub, Kaggle, certificates, and more. One-time setup, 2 minutes.',
    color: 'var(--color-ember)',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    num: '02',
    title: 'ORIN builds your proof',
    desc: 'AI scans your work, identifies proof points, and generates verified Proof Cards.',
    color: 'var(--color-pulse)',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    num: '03',
    title: 'Get coached daily',
    desc: 'AI coach reviews your progress, suggests next steps, and pushes you toward your goals.',
    color: 'var(--color-bloom)',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    num: '04',
    title: 'Land opportunities',
    desc: 'Get matched to roles that fit YOUR proof. Not random listings — curated fits.',
    color: 'var(--color-spark)',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(246,146,38,0.02)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-ember)' }} />
      </div>
      
      <div className="max-w-6xl mx-auto text-center mb-14 relative z-10">
        <div className="inline-block badge-ember mb-6 animate-pulse">How It Works</div>
        <h2 className="text-4xl font-bold tracking-tight mb-4 animate-fadeInUp" style={{ color: 'var(--color-ink)' }}>
          Four steps to{' '}
          <span className="relative inline-block">
            career proof
            <span className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm animate-pulse" style={{ backgroundColor: 'var(--color-ember)', opacity: 0.4 }} />
          </span>
        </h2>
        <p className="text-lg max-w-2xl mx-auto animate-fadeInUp" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
          From scattered tabs to verified proof in minutes, not months.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-5 relative z-10">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="card-base p-7 hover-lift relative overflow-hidden group animate-fadeInUp hover:scale-105 transition-transform"
            style={{ 
              animationDelay: `${i * 0.08}s`,
              background: 'linear-gradient(135deg, var(--color-surface) 0%, #fafafa 100%)'
            }}
          >
            {/* Enhanced background number with gradient */}
            <span
              className="absolute -top-4 -right-2 text-[100px] font-bold leading-none pointer-events-none select-none transition-opacity group-hover:opacity-20"
              style={{ 
                background: step.gradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                opacity: 0.06
              }}
            >
              {step.num}
            </span>
            <div className="relative">
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-bold mb-4 shadow-lg group-hover-lift transition-transform hover:scale-110"
                style={{ 
                  background: step.gradient, 
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
              >
                {step.num}
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover-lift" style={{ color: 'var(--color-ink)' }}>{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
