'use client';

export default function AdminOpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Opportunity Management</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage job listings, internships, and opportunities.
        </p>
      </div>

      <div className="card-base p-12 text-center">
        <svg className="w-12 h-12 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)' }}>
          <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>Opportunities</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          Opportunity management is available through the opportunities API. Full CRUD support coming soon to the admin panel.
        </p>
      </div>
    </div>
  );
}
