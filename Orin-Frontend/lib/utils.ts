import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";
import type {
  User,
  Proof,
  Opportunity,
  CoachNote,
  ProofSource,
  Notification,
  NotificationPreferences,
  Subscription,
} from "./types";
import { cn } from "./cn";

export { cn };

export async function resolvePublicUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  return data?.id ?? null;
}

type DbUser = Database["public"]["Tables"]["users"]["Row"];
type DbProof = Database["public"]["Tables"]["proof_cards"]["Row"];
type DbOpportunity = Database["public"]["Tables"]["opportunities"]["Row"];
type DbCoachNote = Database["public"]["Tables"]["coach_notes"]["Row"];
type DbProofSource = Database["public"]["Tables"]["proof_sources"]["Row"];
type DbNotification = Database["public"]["Tables"]["notifications"]["Row"];
type DbNotifPrefs = Database["public"]["Tables"]["notification_preferences"]["Row"];
type DbSubscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export function mapDbUserToUser(db: DbUser): User {
  return {
    id: db.id,
    authUserId: db.auth_user_id ?? undefined,
    email: db.email,
    username: db.username,
    fullName: db.full_name ?? undefined,
    avatarUrl: db.avatar_url ?? undefined,
    college: db.college ?? undefined,
    year: db.year ?? undefined,
    bio: db.bio ?? undefined,
    headline: db.headline ?? undefined,
    location: db.location ?? undefined,
    websiteUrl: db.website_url ?? undefined,
    githubUrl: db.github_url ?? undefined,
    linkedinUrl: db.linkedin_url ?? undefined,
    twitterUrl: db.twitter_url ?? undefined,
    role: db.role,
    accountStatus: db.account_status,
    isProfilePublic: db.is_profile_public,
    hideEmail: db.hide_email,
    emailVerified: db.email_verified,
    authProvider: db.auth_provider,
    lastLoginAt: db.last_login_at ? new Date(db.last_login_at) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbProofToProof(db: DbProof): Proof {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    description: db.description ?? undefined,
    sourceType: db.source_type,
    sourceUrl: db.source_url ?? undefined,
    thumbnailUrl: db.thumbnail_url ?? undefined,
    skillsExtracted: db.skills_extracted || [],
    skillsUserAdded: db.skills_user_added || [],
    whatItProves: db.what_it_proves || [],
    verificationStatus: db.verification_status,
    visibility: db.visibility,
    verifiedAt: db.verified_at ? new Date(db.verified_at) : undefined,
    viewCount: db.view_count,
    isHighlighted: db.is_highlighted,
    sortOrder: db.sort_order,
    metadata: db.metadata || {},
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbOpportunityToOpportunity(db: DbOpportunity): Opportunity {
  return {
    id: db.id,
    title: db.title,
    company: db.company,
    companyLogoUrl: db.company_logo_url ?? undefined,
    type: db.type,
    requiredSkills: db.required_skills || [],
    niceToHave: db.nice_to_have || [],
    description: db.description ?? undefined,
    location: db.location ?? undefined,
    isRemote: db.is_remote,
    link: db.link,
    applyDeadline: db.apply_deadline ? new Date(db.apply_deadline) : undefined,
    matchPercentage: Number(db.match_percentage),
    salaryMin: db.salary_min ? Number(db.salary_min) : undefined,
    salaryMax: db.salary_max ? Number(db.salary_max) : undefined,
    salaryCurrency: db.salary_currency ?? undefined,
    source: db.source ?? undefined,
    sourceExternalId: db.source_external_id ?? undefined,
    isActive: db.is_active,
    postedAt: db.posted_at ? new Date(db.posted_at) : undefined,
    metadata: db.metadata || {},
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbCoachNoteToCoachNote(db: DbCoachNote): CoachNote {
  return {
    id: db.id,
    userId: db.user_id,
    content: db.content,
    type: db.type,
    actionLabel: db.action_label ?? undefined,
    actionUrl: db.action_url ?? undefined,
    priority: db.priority,
    expiresAt: db.expires_at ? new Date(db.expires_at) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbProofSourceToProofSource(db: DbProofSource): ProofSource {
  return {
    id: db.id,
    userId: db.user_id,
    sourceType: db.source_type,
    sourceUrl: db.source_url ?? undefined,
    sourceName: db.source_name ?? undefined,
    isConnected: db.is_connected,
    lastSyncedAt: db.last_synced_at ? new Date(db.last_synced_at) : undefined,
    metadata: db.metadata || {},
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbNotificationToNotification(db: DbNotification): Notification {
  return {
    id: db.id,
    userId: db.user_id,
    type: db.type,
    title: db.title,
    body: db.body ?? undefined,
    link: db.link ?? undefined,
    payload: db.payload || {},
    readAt: db.read_at ? new Date(db.read_at) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function mapDbNotifPrefsToNotifPrefs(db: DbNotifPrefs): NotificationPreferences {
  return {
    userId: db.user_id,
    weeklySummary: db.weekly_summary,
    recruiterViews: db.recruiter_views,
    verificationStatus: db.verification_changes,
    opportunityMatch: db.opportunity_matches,
    coachTips: db.coach_tips,
    productUpdates: db.product_updates,
    digestFrequency: db.digest_frequency,
  };
}

export function mapDbSubscriptionToSubscription(db: DbSubscription): Subscription {
  return {
    id: db.id,
    userId: db.user_id,
    plan: db.plan,
    status: db.status,
    currentPeriodStart: db.current_period_start ? new Date(db.current_period_start) : undefined,
    currentPeriodEnd: db.current_period_end ? new Date(db.current_period_end) : undefined,
    cancelAtPeriodEnd: db.cancel_at_period_end,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getProofTypeColor(type: string): string {
  const colors: Record<string, string> = {
    github: 'var(--color-ink)',
    kaggle: 'var(--color-ember)',
    certificate: 'var(--color-spark)',
    hackathon: 'var(--color-pulse)',
    project: 'var(--color-bloom)',
    blog: '#8B5CF6',
    demo: '#06B6D4',
    other: 'var(--color-mist)',
  };
  return colors[type] || colors.other;
}

export function getOpportunityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    internship: 'Internship',
    job: 'Full-time',
    scholarship: 'Scholarship',
    mentorship: 'Mentorship',
    hackathon: 'Hackathon',
    research: 'Research',
    other: 'Other',
  };
  return labels[type] || type;
}

export function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; className: string; dotColor: string }> = {
    verified: {
      label: 'Verified',
      className: 'bg-emerald-100 text-emerald-800',
      dotColor: 'bg-emerald-500',
    },
    pending: {
      label: 'Pending',
      className: 'bg-amber-100 text-amber-800',
      dotColor: 'bg-amber-500',
    },
    draft: {
      label: 'Draft',
      className: 'bg-slate-100 text-slate-600',
      dotColor: 'bg-slate-400',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700',
      dotColor: 'bg-red-500',
    },
    saved: {
      label: 'Saved',
      className: 'bg-blue-100 text-blue-700',
      dotColor: 'bg-blue-500',
    },
    applied: {
      label: 'Applied',
      className: 'bg-emerald-100 text-emerald-800',
      dotColor: 'bg-emerald-500',
    },
    interviewing: {
      label: 'Interviewing',
      className: 'bg-purple-100 text-purple-700',
      dotColor: 'bg-purple-500',
    },
    offered: {
      label: 'Offered',
      className: 'bg-emerald-100 text-emerald-800',
      dotColor: 'bg-emerald-600',
    },
    rejected_opp: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700',
      dotColor: 'bg-red-500',
    },
    dismissed: {
      label: 'Dismissed',
      className: 'bg-slate-100 text-slate-600',
      dotColor: 'bg-slate-400',
    },
  };
  return configs[status] || configs.draft;
}
