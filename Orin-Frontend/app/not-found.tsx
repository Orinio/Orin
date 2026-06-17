import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '80vh',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 800,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #0BAB77, #6C5CE7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>404</h1>
        <p style={{
          fontSize: '1.125rem',
          color: '#6b7280',
          margin: '1rem 0 2rem',
        }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: '#0BAB77',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          <Home style={{ width: '1rem', height: '1rem' }} />
          Go home
        </Link>
      </div>
    </div>
  );
}
