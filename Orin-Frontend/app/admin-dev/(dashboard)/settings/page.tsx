'use client';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Admin Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          System configuration and admin account management.
        </p>
      </div>

      {/* Security Info */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-ink)' }}>Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Password Hashing</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>HMAC-SHA512 with 100K iterations + random salt</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Session Tokens</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>HMAC-SHA256 signed, 8-hour expiry, httpOnly cookie</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Brute-Force Protection</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>1.5s delay on failed attempts</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Timing-Safe Comparison</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Prevents timing attacks on password/token verification</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Audit Logging</p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>All admin actions logged to audit_log table</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(11,171,119,0.1)', color: 'var(--color-bloom)' }}>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-ink)' }}>Admin Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Username</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Orin@admin</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Role</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(238,66,102,0.1)', color: 'var(--color-pulse)' }}>
              Super Admin
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Session Duration</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>8 hours</span>
          </div>
        </div>
      </div>

      {/* Admin Powers */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--color-ink)' }}>Admin Powers</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'View all users',
            'Suspend / activate users',
            'Change user roles',
            'Soft-delete users',
            'Verify / reject proofs',
            'Delete proof cards',
            'View audit log',
            'View contact messages',
            'Manage opportunities',
            'View system stats',
            'Access all API routes',
            'Full CRUD operations',
          ].map((power) => (
            <div
              key={power}
              className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]"
              style={{ backgroundColor: 'var(--color-surface-dim)' }}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-bloom)' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>{power}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
