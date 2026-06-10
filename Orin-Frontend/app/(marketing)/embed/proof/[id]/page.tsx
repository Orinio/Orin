import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getServerSupabase } from '@/lib/supabase-server';
import { mapDbProofToProof, getProofTypeColor } from '@/lib/utils';

interface EmbedProofPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ theme?: string }>;
}

export async function generateMetadata({ params }: EmbedProofPageProps) {
  const { id } = await params;
  const supabase = await getServerSupabase();

  const { data: proof } = await supabase
    .from('proof_cards')
    .select('title, description, skills_extracted')
    .eq('id', id)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .maybeSingle();

  if (!proof) {
    return { title: 'Proof Not Found — Orin' };
  }

  return {
    title: `${proof.title} — Orin Proof Card`,
    description: proof.description || `Verified proof: ${proof.title} on Orin`,
    robots: 'noindex, nofollow',
  };
}

export default async function EmbedProofPage({ params, searchParams }: EmbedProofPageProps) {
  const { id } = await params;
  const { theme } = await searchParams;
  const isDark = theme === 'dark';

  const supabase = await getServerSupabase();

  const { data: proofData } = await supabase
    .from('proof_cards')
    .select(`
      *,
      users:user_id (username, full_name, avatar_url)
    `)
    .eq('id', id)
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .maybeSingle();

  if (!proofData) notFound();

  const proof = mapDbProofToProof(proofData);
  const user = proofData.users as any;
  const color = getProofTypeColor(proof.sourceType);

  const sourceTypeLabels: Record<string, string> = {
    github: 'GitHub',
    kaggle: 'Kaggle',
    certificate: 'Certificate',
    hackathon: 'Hackathon',
    project: 'Project',
    blog: 'Blog',
    demo: 'Demo',
    other: 'Other',
  };

  return (
    <html lang="en">
      <head>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        `}</style>
      </head>
      <body>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '24px',
            backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#2a2a4a' : '#e5e7eb'}`,
            boxShadow: isDark
              ? '0 4px 24px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.full_name || user.username}
                width={40}
                height={40}
                style={{ borderRadius: '10px', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#a0a0c0' : '#6b7280',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user?.full_name || user?.username}
              </p>
              <p style={{
                fontSize: '11px',
                color: isDark ? '#6060a0' : '#9ca3af',
              }}>
                Verified on Orin
              </p>
            </div>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
          </div>

          {/* Proof Title */}
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: isDark ? '#ffffff' : '#111827',
            lineHeight: 1.3,
            marginBottom: '8px',
          }}>
            {proof.title}
          </h2>

          {/* Description */}
          {proof.description && (
            <p style={{
              fontSize: '13px',
              color: isDark ? '#a0a0c0' : '#6b7280',
              lineHeight: 1.5,
              marginBottom: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {proof.description}
            </p>
          )}

          {/* Source Type Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: color,
                backgroundColor: `${color}15`,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
              {sourceTypeLabels[proof.sourceType] || proof.sourceType}
            </span>
            {proof.verificationStatus === 'verified' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#10b981',
                  backgroundColor: '#10b98115',
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>

          {/* Skills */}
          {proof.skillsExtracted.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {proof.skillsExtracted.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: isDark ? '#c0c0e0' : '#4b5563',
                    backgroundColor: isDark ? '#2a2a4a' : '#f3f4f6',
                  }}
                >
                  {skill}
                </span>
              ))}
              {proof.skillsExtracted.length > 5 && (
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: isDark ? '#6060a0' : '#9ca3af',
                }}>
                  +{proof.skillsExtracted.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: `1px solid ${isDark ? '#2a2a4a' : '#f3f4f6'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '11px',
              color: isDark ? '#6060a0' : '#9ca3af',
            }}>
              orin.app/{user?.username}
            </span>
            <span style={{
              fontSize: '11px',
              color: isDark ? '#6060a0' : '#9ca3af',
            }}>
              Built with Orin
            </span>
          </div>
        </div>
      </body>
    </html>
  );
}
