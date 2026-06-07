'use client';

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Contact Messages</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          View and manage incoming contact form submissions.
        </p>
      </div>

      <div className="card-base p-12 text-center">
        <svg className="w-12 h-12 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-tertiary)' }}>
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-ink)' }}>Messages</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          Contact message management is available through the contact API. Full inbox UI coming soon.
        </p>
      </div>
    </div>
  );
}
