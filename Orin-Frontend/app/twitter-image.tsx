import { ImageResponse } from 'next/og';
import { DEFAULT_SEO_TITLE, SITE_NAME } from '@/lib/seo';

export const alt = DEFAULT_SEO_TITLE;
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '56px',
          background: '#111827',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, opacity: 0.95 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 16, fontSize: 64, lineHeight: 1.05, fontWeight: 800, maxWidth: 980 }}>
          {DEFAULT_SEO_TITLE}
        </div>
      </div>
    ),
    size,
  );
}
