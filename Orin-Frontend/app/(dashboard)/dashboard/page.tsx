'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, Plus, BarChart3, TrendingUp, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { mapDbProofToProof, mapDbOpportunityToOpportunity, mapDbCoachNoteToCoachNote, mapDbUserToUser, formatNumber, getProofTypeColor } from "@/lib/utils";
import type { Database } from "@/lib/supabase";
import ProofCard from "@/components/ProofCard";
import CoachNote from "@/components/CoachNote";
import type { Proof, Opportunity, CoachNote as CoachNoteType, User } from "@/lib/types";

export default function DashboardPage() {
  const { user: authUser, initialized } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [coachNote, setCoachNote] = useState<CoachNoteType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialized) return;
    if (!authUser) {
      window.location.href = '/signin';
      return;
    }
    setLoading(true);

    const userId = authUser.id;

    async function fetchData() {
      try {
        if (!supabase) return;

        const { data: userDataRaw } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (!userDataRaw) return;

        const currentUser = mapDbUserToUser(userDataRaw);
        setUser(currentUser);

        const [proofsResult, oppsResult, notesResult] = await Promise.all([
          supabase
            .from('proof_cards')
            .select('*')
            .eq('user_id', userDataRaw.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false }),
          supabase
            .from('opportunities')
            .select('*')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('coach_notes')
            .select('*')
            .eq('user_id', userDataRaw.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const { data: proofsData } = proofsResult;
        const { data: oppsData } = oppsResult;
        const { data: noteDataRaw } = notesResult;

        if (proofsData) setProofs(proofsData.map(mapDbProofToProof));
        if (oppsData) setOpportunities(oppsData.map(mapDbOpportunityToOpportunity));

        if (noteDataRaw) {
          setCoachNote(mapDbCoachNoteToCoachNote(noteDataRaw as Database['public']['Tables']['coach_notes']['Row']));
        }
      } catch (e) {
        console.warn('Failed to fetch dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [authUser, initialized]);

  if (!initialized || loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium animate-pulse p-6">
              <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="mt-3 h-8 w-16 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalViews = proofs.reduce((sum, p) => sum + p.viewCount, 0);
  const verifiedCount = proofs.filter((p) => p.verificationStatus === 'verified').length;
  const allSkills = Array.from(new Set(proofs.flatMap((p) => [...p.skillsExtracted, ...p.skillsUserAdded])));
  const skillCounts = allSkills.map((skill) => ({
    name: skill,
    count: proofs.filter((p) => p.skillsExtracted.includes(skill) || p.skillsUserAdded.includes(skill)).length,
  })).sort((a, b) => b.count - a.count);

  const sourceTypeCounts = proofs.reduce((acc, p) => {
    acc[p.sourceType] = (acc[p.sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: "Proof cards", value: proofs.length, delta: `${verifiedCount} verified`, icon: BarChart3, color: 'var(--color-bloom)' },
    { label: "Total skills", value: allSkills.length, delta: `${skillCounts.length} unique`, icon: Sparkles, color: 'var(--color-ember)' },
    { label: "Profile views", value: formatNumber(totalViews), delta: "across all proofs", icon: TrendingUp, color: 'var(--color-pulse)' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="animate-fadeInUp">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-bloom)' }}>
          Dashboard
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Welcome back{user.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Track verified proof and stay on top of your next opportunity.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/sources/new" className="btn-success px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" />
              Add Source
            </Link>
            <Link href={`/${user.username}`} className="btn-outline px-5 py-2.5 text-sm">
              View Profile
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Content */}
        <section className="space-y-8 lg:col-span-8">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="card-premium group p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: `${stat.color}12` }}>
                      <Icon className="h-4 w-4" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.delta}</p>
                </div>
              );
            })}
          </div>

          {/* Coach Note */}
          {coachNote && (
            <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--color-spark)' }} />
                  AI Career Coach
                </h2>
                <Link href="/dashboard/coach" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--color-bloom)' }}>
                  View all notes
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <CoachNote note={coachNote} isLatest={true} />
            </div>
          )}

          {/* Proof Feed */}
          <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>Your proof feed</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Recent proof cards created from your sources.
                </p>
              </div>
              <Link href={`/${user.username}`} className="btn-outline px-4 py-2 text-sm">
                Publish public profile
              </Link>
            </div>

            {proofs.length === 0 ? (
              <div className="card-premium p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
                  <Plus className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>No proof yet. Let&apos;s add your first one!</h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Connect GitHub, upload certificates, or link your competitive programming profiles to get started.
                </p>
                <Link href="/dashboard/sources/new" className="btn-success mt-6 px-5 py-2.5 text-sm">
                  <Plus className="h-4 w-4" />
                  Add your first source
                </Link>
              </div>
            ) : (
              <div id="my-proof" className="grid gap-4 md:grid-cols-2">
                {proofs.slice(0, 6).map((proof) => (
                  <ProofCard key={proof.id} proof={proof} variant="dashboard" />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Skills Summary */}
          <div className="card-premium p-5 animate-fadeInUp" style={{ animationDelay: '150ms' }}>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Skill Summary</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="var(--color-bloom)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min((allSkills.length / 20) * 213.6, 213.6)} 213.6`}
                    className="progress-ring"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>{allSkills.length}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>skills discovered</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {skillCounts.slice(0, 3).map((s) => s.name).join(', ') || 'No skills yet'}
                </p>
              </div>
            </div>
            {skillCounts.length > 0 && (
              <div className="mt-4 space-y-2">
                {skillCounts.slice(0, 5).map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-ink)' }}>{skill.name}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{skill.count} proof{skill.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proof by Type */}
          {Object.keys(sourceTypeCounts).length > 0 && (
            <div className="card-premium p-5 animate-fadeInUp" style={{ animationDelay: '250ms' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Proof by Type</h2>
              <div className="mt-3 space-y-2.5">
                {Object.entries(sourceTypeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getProofTypeColor(type) }} />
                      <span className="capitalize" style={{ color: 'var(--color-ink)' }}>{type}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div id="opportunities" className="card-premium p-5 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
              <div className="mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" style={{ color: 'var(--color-ember)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Opportunities matched</h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {opportunities.length} opportunities match your proof.
              </p>
              <div className="mt-3 space-y-2">
                {opportunities.slice(0, 2).map((opportunity) => (
                  <div key={opportunity.id} className="rounded-xl p-3 transition-colors hover:bg-white/60" style={{ border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{opportunity.company}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {opportunity.title} &middot; {opportunity.matchPercentage}% match
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/opportunities" className="btn-outline mt-4 block w-full px-4 py-2 text-center text-sm">
                View opportunities
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
