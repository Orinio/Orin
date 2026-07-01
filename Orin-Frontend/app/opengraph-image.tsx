import { ImageResponse } from 'next/og';
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, SITE_NAME } from '@/lib/seo';

export const alt = DEFAULT_SEO_TITLE;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(135deg, #0f172a 0%, #111827 45%, #0BAB77 100%)',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid rgba(248,250,252,0.3)',
            borderRadius: 9999,
            padding: '10px 20px',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 800, maxWidth: 1000 }}>
            {DEFAULT_SEO_TITLE}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.4, maxWidth: 1000, color: 'rgba(248,250,252,0.9)' }}>
            {DEFAULT_SEO_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
