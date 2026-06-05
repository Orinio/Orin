import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to start building proof.',
    color: 'var(--color-bloom)',
    features: ['3 proof cards', 'AI coach (basic)', 'Public profile', 'Job board access'],
    cta: 'Start Free',
    highlighted: false,
    gradient: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For students serious about standing out.',
    color: 'var(--color-pulse)',
    features: ['Unlimited proof cards', 'AI coach (advanced)', 'Priority matching', 'Custom profile themes', 'Proof analytics', 'Export to PDF'],
    cta: 'Go Pro',
    highlighted: true,
    gradient: 'linear-gradient(135deg, var(--color-pulse) 0%, #d53f8c 100%)',
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    desc: 'For student orgs and bootcamps.',
    color: 'var(--color-ember)',
    features: ['Everything in Pro', 'Team dashboard', 'Bulk proof generation', 'Branded profiles', 'API access', 'Dedicated support'],
    cta: 'Contact Us',
    highlighted: false,
    gradient: 'linear-gradient(135deg, var(--color-ember) 0%, #dd6b20 100%)',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(238,66,102,0.02)_0%,transparent_70%)]" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-pulse)' }} />
      </div>
      
      <div className="max-w-6xl mx-auto text-center mb-14 relative z-10">
        <div className="inline-block badge-ember mb-6 animate-pulse">Pricing</div>
        <h2 className="text-4xl font-bold tracking-tight mb-4 animate-fadeInUp" style={{ color: 'var(--color-ink)' }}>
          Simple,{' '}
          <span className="relative inline-block">
            student-friendly
            <span className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded-sm animate-pulse" style={{ backgroundColor: 'var(--color-ember)', opacity: 0.4 }} />
          </span>{' '}
          pricing
        </h2>
        <p className="text-lg max-w-2xl mx-auto animate-fadeInUp" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
          Start free. Upgrade when you are ready.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-5 relative z-10">
        {plans.map((plan, i) => (
          <div
            key={plan.name}
            className={`relative p-7 rounded-[var(--radius-xl)] hover-lift animate-fadeInUp ${
              plan.highlighted ? 'ring-2 shadow-lg' : 'card-base'
            }`}
            style={{
              animationDelay: `${i * 0.1}s`,
              ...(plan.highlighted && {
                borderColor: 'var(--color-pulse)',
                ringColor: 'var(--color-pulse)',
              }),
            }}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-pulse text-xs animate-pulse">Most Popular</div>
            )}
            <h3 className="text-xl font-bold mb-1 group-hover-lift" style={{ color: 'var(--color-ink)' }}>{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold animate-pulse" style={{ color: 'var(--color-ink)' }}>{plan.price}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{plan.period}</span>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{plan.desc}</p>
            <ul className="space-y-2 mb-7">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm group-hover-lift" style={{ color: 'var(--color-ink)' }}>
                  <svg className="w-4 h-4 flex-shrink-0 animate-pulse" style={{ color: 'var(--color-bloom)' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`block text-center py-3 rounded-[var(--radius-md)] text-sm font-semibold transition-all ${
                plan.highlighted ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
