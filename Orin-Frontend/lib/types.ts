export type UserRole = 'user' | 'admin' | 'moderator';
export type AccountStatus = 'active' | 'pending' | 'suspended' | 'deactivated';
export type StudentYear = 'first' | 'second' | 'third' | 'fourth' | 'graduate';
export type ProofSourceType = 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
export type VerificationStatus = 'draft' | 'pending' | 'verified' | 'rejected';
export type VisibilityStatus = 'private' | 'unlisted' | 'public';
export type OpportunityType = 'internship' | 'job' | 'scholarship' | 'mentorship' | 'hackathon' | 'research' | 'other';
export type CoachNoteType = 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type AuthProvider = 'email' | 'google' | 'github' | 'apple' | 'linkedin';
export type SubscriptionPlan = 'free' | 'pro' | 'team';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
export type OpportunityStatus = 'saved' | 'applied' | 'dismissed' | 'interviewing' | 'rejected' | 'offered';

export interface User {
  id: string;
  authUserId?: string;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  college?: string;
  year?: StudentYear;
  bio?: string;
  headline?: string;
  location?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isProfilePublic: boolean;
  hideEmail: boolean;
  emailVerified: boolean;
  authProvider: AuthProvider;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proof {
  id: string;
  userId: string;
  title: string;
  description?: string;
  sourceType: ProofSourceType;
  sourceUrl?: string;
  thumbnailUrl?: string;
  skillsExtracted: string[];
  skillsUserAdded: string[];
  whatItProves: string[];
  verificationStatus: VerificationStatus;
  visibility: VisibilityStatus;
  verifiedAt?: Date;
  viewCount: number;
  isHighlighted: boolean;
  sortOrder: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProofSource {
  id: string;
  userId: string;
  sourceType: ProofSourceType;
  sourceUrl?: string;
  sourceName?: string;
  isConnected: boolean;
  lastSyncedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoachNote {
  id: string;
  userId: string;
  content: string;
  type: CoachNoteType;
  actionLabel?: string;
  actionUrl?: string;
  priority: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  type: OpportunityType;
  requiredSkills: string[];
  niceToHave: string[];
  description?: string;
  location?: string;
  isRemote: boolean;
  link: string;
  applyDeadline?: Date;
  matchPercentage: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  source?: string;
  sourceExternalId?: string;
  isActive: boolean;
  postedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOpportunity {
  id: string;
  userId: string;
  opportunityId: string;
  status: OpportunityStatus;
  matchScore?: number;
  notes?: string;
  appliedAt?: Date;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'recruiter_view' | 'verification_update' | 'opportunity_match' | 'coach_tip' | 'weekly_summary' | 'system';
  title: string;
  body?: string;
  link?: string;
  payload: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  weeklySummary: boolean;
  recruiterViews: boolean;
  verificationStatus: boolean;
  opportunityMatch: boolean;
  coachTips: boolean;
  productUpdates: boolean;
  digestFrequency: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'spam';
  userId?: string;
  createdAt: Date;
}

export interface ProofShare {
  id: string;
  proofId: string;
  ownerId: string;
  recipientEmail: string;
  recipientName?: string;
  token?: string;
  kind: 'link' | 'email' | 'recruiter_invite';
  message?: string;
  expiresAt?: Date;
  lastViewedAt?: Date;
  viewCount: number;
  createdAt: Date;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  college?: string;
  year?: StudentYear;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  memberSince: Date;
  publicProofs: {
    id: string;
    title: string;
    description?: string;
    sourceType: ProofSourceType;
    sourceUrl?: string;
    thumbnailUrl?: string;
    skillsExtracted: string[];
    whatItProves: string[];
    viewCount: number;
    createdAt: Date;
  }[];
  publicSkills: string[];
  totalProfileViews: number;
}
