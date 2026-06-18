'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY || process.env.NODE_ENV !== 'production') return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        url_allowlist: ['/dashboard', '/proof', '/opportunities'],
      },
    });
  }, []);

  return <>{children}</>;
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (process.env.NODE_ENV !== 'production') return;
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  if (process.env.NODE_ENV !== 'production') return;
  posthog.reset();
}
