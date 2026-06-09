'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  getPushPermissionState,
} from '@/lib/push-notifications';

export function PushNotificationBanner() {
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    async function check() {
      const supported = await isPushSupported();
      if (!supported) return;

      const state = await getPushPermissionState();
      if (state === 'default') {
        // Show banner after 5 seconds delay
        const timer = setTimeout(() => setShow(true), 5000);
        return () => clearTimeout(timer);
      }
    }
    check();
  }, []);

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        await subscribeToPush();
        setShow(false);
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Don't show again for this session
    sessionStorage.setItem('orin-push-dismissed', 'true');
  };

  useEffect(() => {
    if (sessionStorage.getItem('orin-push-dismissed') === 'true') {
      setShow(false);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-fadeInUp"
      style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-bloom)30',
        backgroundColor: 'var(--color-surface)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-bloom)12' }}
          >
            <Bell size={20} style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Stay updated
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Get AI-powered career tips and opportunity alerts on your lock screen.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleEnable}
                disabled={subscribing}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-bloom)' }}
              >
                {subscribing ? 'Enabling...' : 'Enable notifications'}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 transition hover:opacity-70"
          >
            <X size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
