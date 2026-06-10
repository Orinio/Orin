import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getServerSupabase } from '@/lib/supabase-server';
import ProofCard from '@/components/ProofCard';
import { mapDbUserToUser, mapDbProofToProof, getProofTypeColor } from '@/lib/utils';
import type { User, Proof } from '@/lib/types';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await getServerSupabase();

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, headline, bio, avatar_url, username')
    .eq('username', username)
    .is('deleted_at', null)
    .maybeSingle();

  if (!userData) {
    return { title: 'Profile Not Found — Orin' };
  }

  const displayName = userData.full_name || userData.username;
  const title = `${displayName} — Verified Proof Profile | Orin`;
  const description = userData.headline
    ? `${userData.headline} — View ${displayName}'s verified skills and proof cards on Orin.`
    : `${displayName}'s verified career proof profile on Orin. View skills, projects, and achievements backed by real proof.`;

  const ogImage = userData.avatar_url
    ? `https://orin.app/api/og?title=${encodeURIComponent(displayName)}&subtitle=${encodeURIComponent(userData.headline || 'Verified Proof Profile')}&avatar=${encodeURIComponent(userData.avatar_url)}`
    : `https://orin.app/api/og?title=${encodeURIComponent(displayName)}&subtitle=${encodeURIComponent(userData.headline || 'Verified Proof Profile')}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://orin.app/${userData.username}`,
      siteName: 'Orin',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Orin Profile`,
        },
      ],
      locale: 'en_US',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://orin.app/${userData.username}`,
    },
  };
}

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

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;

  let user: User | null = null;
  let proofs: Proof[] = [];
  let allSkills: string[] = [];

  const supabase = await getServerSupabase();

  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .is('deleted_at', null)
      .maybeSingle();

    if (userError) throw new Error(userError.message);

    if (userData) {
      user = mapDbUserToUser(userData);

      const { data: proofsData } = await supabase
        .from('proof_cards')
        .select('*')
        .eq('user_id', userData.id)
        .eq('visibility', 'public')
        .eq('verification_status', 'verified')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (proofsData) {
        proofs = proofsData.map(mapDbProofToProof);
        allSkills = Array.from(
          new Set(proofsData.flatMap((s) => s.skills_extracted || []))
        );
      }
    }
  } catch (e) {
    console.warn("Error fetching public profile.", e);
  }

  if (!user) notFound();

  const skillCounts = allSkills.map((skill) => ({
    name: skill,
    count: proofs.filter((p) => p.skillsExtracted.includes(skill)).length,
  })).sort((a, b) => b.count - a.count);

  const sourceTypeCounts = proofs.reduce((acc, p) => {
    acc[p.sourceType] = (acc[p.sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const socialLinks = [
    { url: user.githubUrl, label: 'GitHub', icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z' },
    { url: user.linkedinUrl, label: 'LinkedIn', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { url: user.twitterUrl, label: 'X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { url: user.websiteUrl, label: 'Website', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  ].filter((link) => link.url);

  const yearLabels: Record<string, string> = {
    first: '1st Year', second: '2nd Year', third: '3rd Year', fourth: '4th Year', graduate: 'Graduate',
  };

  const totalViewCount = proofs.reduce((sum, p) => sum + p.viewCount, 0);
  const totalProofsCount = proofs.length;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: user.fullName || user.username,
    description: user.bio || user.headline || `Verified proof profile on Orin`,
    url: `https://orin.app/${user.username}`,
    mainEntity: {
      '@type': 'Person',
      name: user.fullName || user.username,
      headline: user.headline,
      description: user.bio,
      image: user.avatarUrl,
      url: `https://orin.app/${user.username}`,
      sameAs: [
        user.githubUrl,
        user.linkedinUrl,
        user.twitterUrl,
        user.websiteUrl,
      ].filter(Boolean),
      knowsAbout: allSkills,
    },
  };

  return (
    <main id="main-content" className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Background ambience — matches landing page */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-10 left-[10%] w-80 h-80 rounded-full blur-3xl opacity-[0.07] animate-pulse-slow"
            style={{ backgroundColor: 'var(--color-spark)' }}
          />
          <div
            className="absolute bottom-0 right-[10%] w-96 h-96 rounded-full blur-3xl opacity-[0.05] animate-pulse-slower"
            style={{ backgroundColor: 'var(--color-ember)' }}
          />
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.03]"
            style={{ backgroundColor: 'var(--color-bloom)' }}
          />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Profile Card — glassmorphism */}
          <div
            className="rounded-[var(--radius-2xl)] p-8 md:p-10 animate-fadeInUp"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 60px -12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-28 h-28 md:w-32 md:h-32 rounded-[var(--radius-xl)] overflow-hidden shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-bloom) 0%, #059669 100%)',
                  }}
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.fullName || user.username}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                      {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Live indicator */}
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: 'var(--color-bloom)' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white pulse-dot" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-wide" style={{ color: 'var(--color-bloom)' }}>
                  @{user.username}
                </p>
                <h1
                  className="mt-2 text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]"
                  style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
                >
                  {user.fullName || user.username}
                </h1>
                {user.headline && (
                  <p className="mt-3 text-lg font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {user.headline}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {user.year && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                    >
                      {yearLabels[user.year]}
                    </span>
                  )}
                  {user.college && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                    >
                      {user.college}
                    </span>
                  )}
                  {user.location && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: 'var(--color-surface-dim)', color: 'var(--color-text-secondary)' }}
                    >
                      {user.location}
                    </span>
                  )}
                </div>
                {user.bio && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {user.bio}
                  </p>
                )}

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d={link.icon} />
                        </svg>
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="relative py-16 px-6" style={{ backgroundColor: 'var(--color-ink)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div
            className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-spark) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--color-bloom) 0%, transparent 70%)' }}
          />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: totalProofsCount, label: 'Verified Proofs', color: 'var(--color-spark)' },
            { value: allSkills.length, label: 'Skills Proven', color: 'var(--color-bloom)' },
            { value: totalViewCount, label: 'Profile Views', color: 'var(--color-ember)' },
            { value: Object.keys(sourceTypeCounts).length, label: 'Connected Sources', color: 'var(--color-pulse)' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl md:text-5xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ SKILLS ═══════════════ */}
      {skillCounts.length > 0 && (
        <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <span className="badge-spark mb-4 inline-flex">Verified Skills</span>
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                Skills backed by{' '}
                <span className="relative inline-block">
                  real proof
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-0 w-full h-2.5 -z-10 rounded-sm"
                    style={{ backgroundColor: 'var(--color-spark)', opacity: 0.45 }}
                  />
                </span>
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {skillCounts.slice(0, 12).map((skill, i) => (
                <div
                  key={skill.name}
                  className="group relative px-5 py-3 rounded-[var(--radius-lg)] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-default"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${getProofTypeColor(Object.keys(sourceTypeCounts)[0] || 'other')} 0%, ${getProofTypeColor(Object.keys(sourceTypeCounts)[0] || 'other')}dd 100%)`,
                      }}
                    >
                      {skill.count}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                        {skill.name}
                      </p>
                      <p className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {skill.count} proof{skill.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ PROOF BY TYPE ═══════════════ */}
      {Object.keys(sourceTypeCounts).length > 0 && (
        <section className="py-12 px-6" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}>
              Proof Breakdown
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(sourceTypeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const percentage = totalProofsCount > 0 ? Math.round((count / totalProofsCount) * 100) : 0;
                  const color = getProofTypeColor(type);
                  return (
                    <div
                      key={type}
                      className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius-lg)] transition-all duration-200 hover:shadow-md"
                      style={{
                        backgroundColor: 'var(--color-paper)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                          {sourceTypeLabels[type] || type}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                          {count} proof{count !== 1 ? 's' : ''} · {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════ PROOFS GRID ═══════════════ */}
      {proofs.length > 0 && (
        <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                {user.fullName?.split(' ')[0] || user.username}&apos;s{' '}
                <span className="relative inline-block">
                  proof gallery
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-0 w-full h-2.5 -z-10 rounded-sm"
                    style={{ backgroundColor: 'var(--color-pulse)', opacity: 0.3 }}
                  />
                </span>
              </h2>
              <p className="mt-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {totalProofsCount} verified proof{totalProofsCount !== 1 ? 's' : ''} of real work
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {proofs.slice(0, 6).map((proof) => (
                <ProofCard key={proof.id} proof={proof} variant="public" />
              ))}
            </div>
            {proofs.length > 6 && (
              <div className="mt-8 text-center">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  + {proofs.length - 6} more proof{proofs.length - 6 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════ EMPTY STATE ═══════════════ */}
      {proofs.length === 0 && (
        <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
          <div className="max-w-xl mx-auto text-center">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-[var(--radius-xl)] flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface-dim)' }}
            >
              <svg className="w-10 h-10" style={{ color: 'var(--color-mist)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
              No public proofs yet
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              This profile is just getting started. Check back soon!
            </p>
          </div>
        </section>
      )}

      {/* ═══════════════ FOOTER CTA ═══════════════ */}
      <footer
        className="py-12 px-6"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="max-w-xl mx-auto text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Build your own proof profile on{' '}
            <Link href="/" className="font-bold hover:underline" style={{ color: 'var(--color-pulse)' }}>
              Orin
            </Link>
          </p>
          <Link
            href="/signup"
            className="btn-primary mt-5 inline-flex text-sm"
          >
            Start Building Proof
          </Link>
        </div>
      </footer>
    </main>
  );
}
