const stats = [
  { value: '5,240+', label: 'Active students', color: 'var(--color-bloom)', icon: '👥' },
  { value: '18,300', label: 'Proof cards generated', color: 'var(--color-ember)', icon: '📋' },
  { value: '88%', label: 'Feel more career-ready', color: 'var(--color-pulse)', icon: '🎯' },
  { value: '4.9/5', label: 'Student satisfaction', color: 'var(--color-spark)', icon: '⭐' },
];

export default function Stats() {
  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{ backgroundColor: 'var(--color-ink)' }}>
      {/* Enhanced background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.03]" style={{ backgroundColor: 'var(--color-spark)' }} />
      </div>
      
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="group animate-fadeInUp hover-lift transition-transform hover:scale-105"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="text-5xl mb-3 animate-pulse" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div
              className="text-4xl font-bold mb-2 transition-colors group-hover:scale-110"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
