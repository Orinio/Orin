const steps = [
  {
    num: '01',
    title: 'Connect your sources',
    desc: 'Link GitHub, Kaggle, certificates, and more. One-time setup, 2 minutes.',
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
  {
    num: '02',
    title: 'ORIN builds your proof',
    desc: 'AI scans your work, identifies proof points, and generates verified Proof Cards.',
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    num: '03',
    title: 'Get coached daily',
    desc: 'AI coach reviews your progress, suggests next steps, and pushes you toward your goals.',
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    num: '04',
    title: 'Land opportunities',
    desc: 'Get matched to roles that fit YOUR proof. Not random listings — curated fits.',
    gradient: 'linear-gradient(135deg, var(--color-spark) 0%, #d69e2e 100%)',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Soft background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-ember)' }} />
      </div>

      <div className="max-w-6xl mx-auto text-center mb-14 relative z-10">
        <div className="badge-ember mb-6 animate-fadeInUp">How It Works</div>
        <h2
          className="text-4xl font-bold tracking-tight mb-4 animate-fadeInUp"
          style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
        >
          Four steps to{' '}
          <span className="relative inline-block">
            career proof
            <span
              aria-hidden="true"
              className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm"
              style={{ backgroundColor: 'var(--color-ember)', opacity: 0.4 }}
            />
          </span>
        </h2>
        <p
          className="text-lg max-w-2xl mx-auto animate-fadeInUp"
          style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
        >
          From scattered tabs to verified proof in minutes, not months.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-5 relative z-10">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className="card-base p-7 relative overflow-hidden group animate-fadeInUp"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            {/* Background number */}
            <span
              aria-hidden="true"
              className="absolute -top-4 -right-2 text-[100px] font-bold leading-none pointer-events-none select-none transition-opacity duration-300 group-hover:opacity-[0.12]"
              style={{
                background: step.gradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                opacity: 0.06,
              }}
            >
              {step.num}
            </span>
            <div className="relative">
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-bold mb-4 shadow-md transition-transform duration-300 group-hover:scale-110"
                style={{ background: step.gradient, color: '#fff' }}
              >
                {step.num}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
