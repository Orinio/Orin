import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/lib/seo';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? `${SITE_NAME} Profile`;
  const subtitle = searchParams.get('subtitle') ?? 'Verified Proof Profile';
  const avatar = searchParams.get('avatar');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #111827 0%, #0f172a 55%, #0BAB77 100%)',
          color: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '56px',
          alignItems: 'center',
          gap: '36px',
        }}
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={180}
            height={180}
            style={{
              borderRadius: '9999px',
              border: '4px solid rgba(248,250,252,0.5)',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: '9999px',
              background: 'rgba(248,250,252,0.15)',
              border: '4px solid rgba(248,250,252,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 860 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid rgba(248,250,252,0.35)',
              borderRadius: 9999,
              padding: '8px 16px',
              fontSize: 22,
              fontWeight: 600,
              width: 'fit-content',
            }}
          >
            {SITE_NAME}
          </div>
          <div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 800 }}>
            {title}
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.3, color: 'rgba(248,250,252,0.92)' }}>
            {subtitle}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
