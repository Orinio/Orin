const stats = [
  { value: '5,240+', label: 'Active students', color: 'var(--color-bloom)' },
  { value: '18,300', label: 'Proof cards generated', color: 'var(--color-ember)' },
  { value: '88%', label: 'Feel more career-ready', color: 'var(--color-pulse)' },
  { value: '4.9/5', label: 'Student satisfaction', color: 'var(--color-spark)' },
];

export default function Stats() {
  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-ink)' }}
    >
      {/* Soft background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.06]"
          style={{ backgroundColor: 'var(--color-spark)' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.04]"
          style={{ backgroundColor: 'var(--color-pulse)' }}
        />
      </div>

      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-fadeInUp"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div
              className="text-5xl font-bold mb-2 tracking-tight"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div
              className="text-sm font-medium"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
