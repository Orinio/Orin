'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function EmployerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '50vh',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '0.5rem' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          {error.message || 'An error occurred in the employer portal'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            backgroundColor: '#0BAB77',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
