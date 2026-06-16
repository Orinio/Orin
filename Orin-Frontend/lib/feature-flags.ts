import type { UserRole } from './types';
import type { SubscriptionPlanId } from './chat-types';

export type FeatureFlag =
  | 'social_feed'
  | 'messaging'
  | 'ai_chat'
  | 'analytics'
  | 'skill_gap'
  | 'opportunities'
  | 'university_dashboard'
  | 'employer_portal'
  | 'admin_panel'
  | 'team_management'
  | 'advanced_proof'
  | 'real_time_notifications'
  | 'user_search'
  | 'profile_customization'
  | 'export_data';

interface FeatureDefinition {
  flag: FeatureFlag;
  label: string;
  description: string;
  minRole?: UserRole[];
  minPlan?: SubscriptionPlanId;
}

export const FEATURES: FeatureDefinition[] = [
  { flag: 'social_feed', label: 'Social Feed', description: 'View and interact with proof cards from your network' },
  { flag: 'messaging', label: 'Messaging', description: 'Send direct messages to other users' },
  { flag: 'ai_chat', label: 'AI Chat', description: 'Chat with AI career coach' },
  { flag: 'analytics', label: 'Analytics', description: 'View profile and proof analytics' },
  { flag: 'skill_gap', label: 'Skill Gap Analysis', description: 'Analyze skill gaps and get recommendations' },
  { flag: 'opportunities', label: 'Opportunities', description: 'Browse job and internship opportunities' },
  { flag: 'university_dashboard', label: 'University Dashboard', description: 'Manage university-specific features', minRole: ['university', 'admin'] },
  { flag: 'employer_portal', label: 'Employer Portal', description: 'Access employer-specific features', minRole: ['employer', 'admin'] },
  { flag: 'admin_panel', label: 'Admin Panel', description: 'Access admin controls', minRole: ['admin'] },
  { flag: 'team_management', label: 'Team Management', description: 'Manage team members', minRole: ['user', 'university', 'admin'], minPlan: 'team' },
  { flag: 'advanced_proof', label: 'Advanced Proofs', description: 'Create advanced proof cards with rich media', minPlan: 'pro' },
  { flag: 'real_time_notifications', label: 'Real-time Notifications', description: 'Receive instant notifications' },
  { flag: 'user_search', label: 'User Search', description: 'Search for other users' },
  { flag: 'profile_customization', label: 'Profile Customization', description: 'Customize your profile appearance', minPlan: 'pro' },
  { flag: 'export_data', label: 'Export Data', description: 'Export your data', minPlan: 'pro' },
];

const PLAN_HIERARCHY: Record<SubscriptionPlanId, number> = {
  free: 0,
  pro: 1,
  team: 2,
  university: 3,
};

export function isFeatureEnabled(
  flag: FeatureFlag,
  role: UserRole,
  plan: SubscriptionPlanId
): boolean {
  const feature = FEATURES.find((f) => f.flag === flag);
  if (!feature) return false;

  if (feature.minRole && !feature.minRole.includes(role)) return false;
  if (feature.minPlan && PLAN_HIERARCHY[plan] < PLAN_HIERARCHY[feature.minPlan]) return false;

  return true;
}

export function getEnabledFeatures(
  role: UserRole,
  plan: SubscriptionPlanId
): FeatureFlag[] {
  return FEATURES.filter((f) => isFeatureEnabled(f.flag, role, plan)).map((f) => f.flag);
}

export function getFeatureDefinition(flag: FeatureFlag): FeatureDefinition | undefined {
  return FEATURES.find((f) => f.flag === flag);
}
