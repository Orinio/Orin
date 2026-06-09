'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Plus, BarChart3, TrendingUp, Briefcase, AlertCircle, RefreshCw, User, ExternalLink, Sparkles, ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCurrentUser, useDashboardStats } from "@/lib/queries/user";
import { useProofs } from "@/lib/queries/proofs";
import { formatNumber, getProofTypeColor } from "@/lib/utils";
import ProofCard from "@/components/ProofCard";
import CoachNote from "@/components/CoachNote";
import { PlanCard } from "@/components/PlanCard";
import ActivityTimeline from "@/components/ActivityTimeline";

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => { controls.stop(); unsubscribe(); };
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80;
  const h = 32;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  const areaPath = `M${data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - (v / max) * (h - 6) - 3;
    return `${x},${y}`;
  }).join(" L")} L${w},${h} L0,${h} Z`;

  return (
    <svg width={w} height={h} className="shrink-0 opacity-70">
      <defs>
        <linearGradient id={`sparkFill-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`${data.map((v, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * w;
        const y = h - (v / max) * (h - 6) - 3;
        return `${x},${y}`;
      }).join(" ")} ${w},${h} 0,${h}`} fill={`url(#sparkFill-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardSkeleton() {
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
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="card-premium animate-pulse p-6">
            <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="mt-3 h-3 w-48 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileCompletionCard({ user }: { user: { fullName?: string; headline?: string; bio?: string; location?: string; username?: string } }) {
  const checks = [
    { label: 'Full name', done: !!user.fullName },
    { label: 'Headline', done: !!user.headline },
    { label: 'Bio', done: !!user.bio },
    { label: 'Location', done: !!user.location },
    { label: 'Username', done: !!user.username },
  ];
  const completed = checks.filter(c => c.done).length;
  const total = checks.length;
  const percent = Math.round((completed / total) * 100);

  if (percent === 100) return null;

  return (
    <div className="card-premium p-5 animate-fadeInUp" style={{ border: '1px solid var(--color-bloom)20' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-bloom)12' }}>
          <User className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Complete your profile</h3>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{completed}/{total} fields completed</p>
        </div>
        <span className="text-sm font-bold" style={{ color: 'var(--color-bloom)' }}>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ backgroundColor: 'var(--color-surface-dim)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: 'var(--color-bloom)' }} />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {checks.map(check => (
          <span key={check.label} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{
            backgroundColor: check.done ? 'var(--color-bloom)12' : 'var(--color-surface-dim)',
            color: check.done ? 'var(--color-bloom)' : 'var(--color-text-tertiary)',
          }}>
            {check.done ? '✓' : '○'} {check.label}
          </span>
        ))}
      </div>
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-bloom)' }}>
        Complete profile <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function QuickStartCard() {
  return (
    <div className="card-premium p-5 animate-fadeInUp" style={{ border: '1px solid var(--color-ember)20', backgroundColor: 'var(--color-ember)04' }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4" style={{ color: 'var(--color-ember)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Get started with Orin</h3>
      </div>
      <div className="space-y-2">
        <Link href="/dashboard/proof/new" className="flex items-center gap-3 rounded-xl p-3 transition-all hover:scale-[1.01]" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-bloom)12' }}>
            <Plus className="h-4 w-4" style={{ color: 'var(--color-bloom)' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Create your first proof card</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Showcase your skills and achievements</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
        </Link>
        <Link href="/dashboard/sources/new" className="flex items-center gap-3 rounded-xl p-3 transition-all hover:scale-[1.01]" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-ember)12' }}>
            <ExternalLink className="h-4 w-4" style={{ color: 'var(--color-ember)' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Connect a source</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>GitHub, Kaggle, certificates, and more</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
        </Link>
        <Link href="/dashboard/ai-chat" className="flex items-center gap-3 rounded-xl p-3 transition-all hover:scale-[1.01]" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-pulse)12' }}>
            <Sparkles className="h-4 w-4" style={{ color: 'var(--color-pulse)' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>Chat with AI coach</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>Get career advice and proof analysis</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5" style={{ color: 'var(--color-text-tertiary)' }} />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, initialized } = useAuth();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useDashboardStats(user?.id ?? null);

  useEffect(() => {
    if (user && !userLoading) {
      const hasCompletedOnboarding = typeof window !== 'undefined' && localStorage.getItem('orin.onboarded');
      if (!hasCompletedOnboarding && !user.fullName && !user.headline && !user.bio) {
        router.push('/onboarding');
      }
    }
  }, [user, userLoading, router]);

  if (!initialized || userLoading) {
    return <DashboardSkeleton />;
  }

  if (!authUser) {
    router.push('/signin');
    return null;
  }

  if (statsError) {
    return (
      <div className="space-y-6">
        <div className="card-premium p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10" style={{ color: 'var(--color-pulse)' }} />
          <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Failed to load dashboard</h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{statsError.message}</p>
          <button onClick={() => refetch()} className="btn-success mt-4 px-4 py-2 text-sm inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const proofsCount = stats?.proofsCount ?? 0;
  const verifiedCount = stats?.verifiedCount ?? 0;
  const totalViews = stats?.totalViews ?? 0;
  const uniqueSkills = stats?.uniqueSkills ?? 0;
  const topSkills = stats?.topSkills ?? [];
  const sourceTypeCounts = stats?.sourceTypeCounts ?? {};
  const opportunities = stats?.recentOpportunities ?? [];
  const coachNote = stats?.latestCoachNote ?? null;

  const hasData = proofsCount > 0 || uniqueSkills > 0 || totalViews > 0;

  const statsCards = [
    {
      label: "Proof cards",
      value: proofsCount,
      rawValue: proofsCount,
      delta: `${verifiedCount} verified`,
      icon: BarChart3,
      color: "var(--color-bloom)",
      sparkline: [2, 4, 3, 6, 5, 8, proofsCount],
      trend: proofsCount > 0 ? 12 : undefined,
    },
    {
      label: "Total skills",
      value: uniqueSkills,
      rawValue: uniqueSkills,
      delta: `${topSkills.length} top`,
      icon: TrendingUp,
      color: "var(--color-ember)",
      sparkline: [1, 2, 3, 2, 4, 3, uniqueSkills],
      trend: uniqueSkills > 0 ? 8 : undefined,
    },
    {
      label: "Profile views",
      value: formatNumber(totalViews),
      rawValue: totalViews,
      delta: "across all proofs",
      icon: Briefcase,
      color: "var(--color-pulse)",
      sparkline: [10, 15, 12, 20, 18, 25, totalViews],
      trend: totalViews > 0 ? 24 : undefined,
    },
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
              {hasData
                ? 'Track verified proof and stay on top of your next opportunity.'
                : 'Start building your career proof portfolio.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/sources/new" className="btn-success px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" />
              Add Source
            </Link>
            {user.username && (
              <Link href={`/${user.username}`} className="btn-outline px-5 py-2.5 text-sm">
                View Profile
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Profile Completion - show if profile is incomplete */}
      {!hasData && <ProfileCompletionCard user={user} />}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Content */}
        <section className="space-y-8 lg:col-span-8">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}08, ${stat.color}15)`,
                    border: `1px solid ${stat.color}20`,
                  }}
                  whileHover={{ scale: 1.02, boxShadow: `0 8px 30px ${stat.color}15` }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.label}</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>
                      <AnimatedCounter value={stat.rawValue} />
                    </p>
                    <MiniSparkline data={stat.sparkline} color={stat.color} />
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {stat.trend !== undefined && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--color-bloom)' }}>
                        {stat.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(stat.trend)}%
                      </span>
                    )}
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{stat.delta}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Coach Note */}
          {coachNote && (
            <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>
                  AI Career Coach
                </h2>
                <Link href="/dashboard/ai-chat" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: 'var(--color-bloom)' }}>
                  View all notes
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
              {user.username && (
                <Link href={`/${user.username}`} className="btn-outline px-4 py-2 text-sm">
                  Publish public profile
                </Link>
              )}
            </div>

            {proofsCount === 0 ? (
              <div className="card-premium p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-bloom)12' }}>
                  <Plus className="h-8 w-8" style={{ color: 'var(--color-bloom)' }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>No proof yet. Let&apos;s add your first one!</h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  Connect GitHub, upload certificates, or link your competitive programming profiles to get started.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/dashboard/proof/new" className="btn-success px-5 py-2.5 text-sm inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create your first proof
                  </Link>
                  <Link href="/dashboard/sources/new" className="btn-outline px-5 py-2.5 text-sm inline-flex items-center gap-2">
                    Add a source
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 md:grid-cols-2 opacity-40 pointer-events-none">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl p-5" style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl" style={{ backgroundColor: 'var(--color-bloom)12' }} />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-3/4 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                          <div className="h-2 w-1/2 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="h-2 w-full rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                        <div className="h-2 w-2/3 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="h-5 w-14 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
                        <div className="h-5 w-12 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ProofFeed dbUserId={user.id} />
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Quick Start - show when no data */}
          {!hasData && <QuickStartCard />}

          {/* Skills Summary */}
          {uniqueSkills > 0 && (
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
                      strokeDasharray={`${Math.min((uniqueSkills / 20) * 213.6, 213.6)} 213.6`}
                      className="progress-ring"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: 'var(--color-ink)' }}>{uniqueSkills}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>skills discovered</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {topSkills.slice(0, 3).map((s) => s.name).join(', ')}
                  </p>
                </div>
              </div>
              {topSkills.length > 0 && (
                <div className="mt-4 space-y-2">
                  {topSkills.slice(0, 5).map((skill) => (
                    <div key={skill.name} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--color-ink)' }}>{skill.name}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{skill.count} proof{skill.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Plan card */}
          <div className="animate-fadeInUp" style={{ animationDelay: '230ms' }}>
            <PlanCard />
          </div>

          {/* Activity Timeline */}
          {user && (
            <div className="animate-fadeInUp" style={{ animationDelay: '240ms' }}>
              <ActivityTimeline dbUserId={user.id} />
            </div>
          )}

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
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-ink)' }}>Trending opportunities</h2>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {opportunities.length} opportunities available.
              </p>
              <div className="mt-3 space-y-2">
                {opportunities.slice(0, 3).map((opportunity) => (
                  <div key={opportunity.id} className="rounded-xl p-3 transition-colors hover:bg-[var(--color-surface)]/60" style={{ border: '1px solid var(--color-border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{opportunity.company}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {opportunity.title}
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/opportunities" className="btn-outline mt-4 block w-full px-4 py-2 text-center text-sm">
                View all opportunities
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * Separate component for proof feed — uses React Query for automatic refetching.
 */
function ProofFeed({ dbUserId }: { dbUserId: string }) {
  const { data: proofs, isLoading } = useProofs(dbUserId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="card-premium animate-pulse p-6">
            <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="mt-3 h-3 w-48 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id="my-proof" className="grid gap-4 md:grid-cols-2">
      {(proofs || []).slice(0, 6).map((proof) => (
        <ProofCard key={proof.id} proof={proof} variant="dashboard" />
      ))}
    </div>
  );
}
