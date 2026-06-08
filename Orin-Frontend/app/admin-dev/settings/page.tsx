'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Key, Database, RefreshCw, Loader2, Check, AlertTriangle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [sessionInfo, setSessionInfo] = useState<{ username: string; role: string; exp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-dev/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setSessionInfo({ username: d.username, role: d.role, exp: d.exp });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-bloom)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Settings className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          Admin Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          System configuration and admin session info
        </p>
      </div>

      {/* Session Info */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--color-bloom)' }} />
          Current Session
        </h2>
        {sessionInfo ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Username</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{sessionInfo.username}</span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Role</span>
              <span className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(238,66,102,0.1)', color: 'var(--color-pulse)' }}>
                {sessionInfo.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Session Expires</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                {new Date(sessionInfo.exp).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Status</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-bloom)' }}>
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: 'var(--color-bloom)' }} />
                Active
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No session info available</p>
        )}
      </div>

      {/* System Info */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Database className="w-4 h-4" style={{ color: 'var(--color-ember)' }} />
          System Information
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Admin Auth', value: 'HMAC-SHA512 + Signed Sessions', status: 'ok' as const },
            { label: 'Session Storage', value: 'HttpOnly Secure Cookie', status: 'ok' as const },
            { label: 'RLS Policies', value: 'Active (admin bypass enabled)', status: 'ok' as const },
            { label: 'Audit Logging', value: 'All admin actions logged', status: 'ok' as const },
            { label: 'API Protection', value: 'Admin cookie auth required', status: 'ok' as const },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
              <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                {item.status === 'ok' ? (
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-bloom)' }} />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-ember)' }} />
                )}
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Powers */}
      <div className="card-base p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-ink)' }}>
          <Key className="w-4 h-4" style={{ color: 'var(--color-pulse)' }} />
          Admin Capabilities
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            'Edit any user profile',
            'Change user roles (user/mod/admin)',
            'Suspend / deactivate accounts',
            'Upgrade / downgrade subscriptions',
            'Verify / reject proof cards',
            'Delete any proof or source',
            'Manage opportunities',
            'Send notifications to users',
            'View full audit trail',
            'Access all contact messages',
            'Manage system settings',
            'Soft-delete with recovery',
          ].map(power => (
            <div key={power} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-bloom)' }} />
              {power}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
