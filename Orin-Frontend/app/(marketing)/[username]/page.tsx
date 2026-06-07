import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabase-server';
import ProofCard from '@/components/ProofCard';
import ProfileSuggestions from '@/components/ProfileSuggestions';
import { mapDbUserToUser, mapDbProofToProof, getProofTypeColor } from '@/lib/utils';
import type { User, Proof } from '@/lib/types';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

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
    console.warn("Error fetching public profile, falling back to mock.", e);
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
    { url: user.twitterUrl, label: 'Twitter / X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { url: user.websiteUrl, label: 'Website', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
  ].filter((link) => link.url);

  const yearLabels: Record<string, string> = {
    first: '1st year', second: '2nd year', third: '3rd year', fourth: '4th year', graduate: 'Graduate',
  };

  const totalViewCount = proofs.reduce((sum, p) => sum + p.viewCount, 0);

  return (
    <main id="main-content" className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8">
      <section className="rounded-[var(--radius-lg)] bg-gradient-to-br from-white to-[var(--color-neutral-surface-alt)] p-6 border border-[var(--color-neutral-border)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-primary-emerald)]">@{user.username}</p>
            <h1 className="mt-2 text-4xl font-semibold md:text-5xl font-serif">{user.fullName || user.username}</h1>
            {user.headline && (
              <p className="mt-2 text-[var(--color-neutral-text)] font-medium">{user.headline}</p>
            )}
            <p className="mt-1 text-[var(--color-neutral-text-secondary)]">
              {user.year && yearLabels[user.year]}{user.college && ` @ ${user.college}`}
              {user.location && ` · ${user.location}`}
            </p>
            {user.bio && (
              <p className="mt-3 max-w-2xl text-sm text-[var(--color-neutral-text-secondary)]">{user.bio}</p>
            )}
          </div>
          <div className="flex gap-4 text-center">
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-3">
              <p className="text-2xl font-bold text-[var(--color-primary-emerald)]">{proofs.length}</p>
              <p className="text-xs text-[var(--color-neutral-text-secondary)]">Proofs</p>
            </div>
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-3">
              <p className="text-2xl font-bold text-[var(--color-primary-emerald)]">{allSkills.length}</p>
              <p className="text-xs text-[var(--color-neutral-text-secondary)]">Skills</p>
            </div>
            <div className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-3">
              <p className="text-2xl font-bold text-[var(--color-primary-emerald)]">{totalViewCount}</p>
              <p className="text-xs text-[var(--color-neutral-text-secondary)]">Views</p>
            </div>
          </div>
        </div>
        {socialLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border-2 border-[var(--color-primary-emerald)] bg-transparent px-4 py-2 font-semibold text-[var(--color-primary-emerald)] transition hover:bg-[var(--color-primary-soft)]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d={link.icon} />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </section>

      <ProfileSuggestions
        username={user.username}
        skills={allSkills}
        proofCount={proofs.length}
        verifiedCount={proofs.filter(p => p.verificationStatus === 'verified').length}
      />

      {allSkills.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">Verified Skills</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {skillCounts.slice(0, 8).map((skill) => (
              <div key={skill.name} className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] p-4">
                <h3 className="text-base font-semibold text-[var(--color-neutral-text)]">{skill.name}</h3>
                <p className="mt-1 text-sm text-[var(--color-neutral-text-secondary)]">
                  {skill.count} proof{skill.count !== 1 ? 's' : ''} verified
                </p>
                <div className="mt-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(sourceTypeCounts).length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[var(--color-neutral-text)]">Proof by Type</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(sourceTypeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-neutral-surface)] px-4 py-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getProofTypeColor(type) }} />
                <span className="text-sm font-medium text-[var(--color-neutral-text)] capitalize">{type}</span>
                <span className="text-xs text-[var(--color-neutral-text-secondary)]">({count})</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-[var(--color-neutral-text)] font-serif">
          {user.fullName || user.username}&apos;s Proof ({proofs.length} total)
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {proofs.slice(0, 4).map((proof) => (
            <ProofCard key={proof.id} proof={proof} variant="public" />
          ))}
        </div>
      </section>

      <footer className="mt-10 border-t border-[var(--color-neutral-border)] py-6 text-sm text-[var(--color-neutral-text-secondary)]">
        <p>Create your own proof profile on <Link href="/" className="text-[var(--color-primary-emerald)] hover:underline">Orin</Link>.</p>
      </footer>
    </main>
  );
}
