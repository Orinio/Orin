const services = [
  { name: 'Web Application', status: 'operational', uptime: '99.98%' },
  { name: 'API', status: 'operational', uptime: '99.99%' },
  { name: 'AI Coach', status: 'operational', uptime: '99.95%' },
  { name: 'Cloud Connectors', status: 'operational', uptime: '99.97%' },
  { name: 'Email Delivery', status: 'operational', uptime: '100%' },
  { name: 'Authentication', status: 'operational', uptime: '99.99%' },
];

const incidents: { date: string; title: string; duration: string; impact: string }[] = [
  { date: 'May 28, 2026', title: 'Scheduled maintenance — database upgrade', duration: '15 min', impact: 'No downtime expected' },
  { date: 'May 12, 2026', title: 'Intermittent API latency spikes', duration: '22 min', impact: 'Degraded performance for <5% of requests' },
  { date: 'April 3, 2026', title: 'Cloud connector sync delays', duration: '45 min', impact: 'Delayed imports from Google Drive' },
];

export default function StatusPage() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-28 pb-16 px-6"
        style={{ backgroundColor: 'var(--color-paper)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-[0.07] animate-pulse-slow"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-fadeInUp" style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="absolute inline-flex h-full w-full animate-pulse-slow rounded-full opacity-50"
                style={{ backgroundColor: 'var(--color-bloom)' }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: 'var(--color-bloom)' }}
              />
            </span>
            All systems operational
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.06] animate-fadeInUp"
            style={{ color: 'var(--color-ink)', animationDelay: '0.1s' }}
          >
            System Status
          </h1>
          <p
            className="text-lg max-w-xl mx-auto animate-fadeInUp"
            style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}
          >
            Real-time status of all Orin services.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="rounded-[var(--radius-xl)] border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-paper)' }}>
            <div className="px-6 py-4" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>Service Health</h2>
            </div>
            {services.map((service, i) => (
              <div
                key={service.name}
                className="flex items-center justify-between px-6 py-4 border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-bloom)' }}
                  />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    {service.name}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {service.uptime} uptime
                  </span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}
                  >
                    Operational
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Uptime */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center" style={{ color: 'var(--color-ink)' }}>
            90-day uptime
          </h2>
          <div className="card-base p-6">
            <div className="flex items-end gap-[3px] h-20">
              {Array.from({ length: 90 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all hover:opacity-80"
                  style={{
                    height: i === 47 ? '70%' : i === 25 ? '85%' : '100%',
                    backgroundColor: i === 47 ? 'var(--color-ember)' : 'var(--color-bloom)',
                    minWidth: '2px',
                  }}
                  title={i === 47 ? 'Incident on May 12' : i === 25 ? 'Incident on Apr 3' : 'No incidents'}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>90 days ago</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Today</span>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-bloom)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-ember)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Degraded performance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Past Incidents */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center" style={{ color: 'var(--color-ink)' }}>
            Past incidents
          </h2>
          {incidents.length === 0 ? (
            <div className="card-base p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No incidents in the past 90 days.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident, i) => (
                <div
                  key={i}
                  className="card-base p-5 animate-fadeInUp"
                  style={{ animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                        {incident.title}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {incident.impact}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        {incident.date}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {incident.duration}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
