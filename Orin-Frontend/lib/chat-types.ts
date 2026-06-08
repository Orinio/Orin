export type StorageTier = 'local' | 'cloud';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentId?: string;
  toolCalls?: Array<{ tool: string; args: any; result: any }>;
  durationMs?: number;
  thinking?: string;
  rating?: 'positive' | 'negative' | 'flagged';
  ratingFeedback?: string;
}

export interface ChatConversation {
  id: string;
  userId: string | null;
  agentId: string;
  title: string;
  messages: ChatMessage[];
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  storage: StorageTier;
}

export interface CloudProvider {
  id: 'google_drive' | 'dropbox' | 'notion' | 'github' | 'onedrive';
  name: string;
  description: string;
  icon: string;
  brandColor: string;
  category: 'storage' | 'productivity' | 'code';
  scopes: string[];
  freeSupported: boolean;
}

export const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Import documents, slides, and files as proof.',
    icon: 'HardDrive',
    brandColor: '#4285F4',
    category: 'storage',
    scopes: ['drive.readonly', 'drive.file'],
    freeSupported: true,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Pull portfolios, case studies, and exports.',
    icon: 'Cloud',
    brandColor: '#0061FF',
    category: 'storage',
    scopes: ['files.metadata.read', 'files.content.read'],
    freeSupported: true,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Connect Microsoft 365 files and reports.',
    icon: 'Cloud',
    brandColor: '#0078D4',
    category: 'storage',
    scopes: ['Files.Read', 'Files.ReadWrite'],
    freeSupported: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync Notion pages and project notes.',
    icon: 'FileText',
    brandColor: '#000000',
    category: 'productivity',
    scopes: ['read_content', 'update_content'],
    freeSupported: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Verify repos, contributions, and READMEs.',
    icon: 'Github',
    brandColor: '#181717',
    category: 'code',
    scopes: ['read:user', 'repo', 'read:org'],
    freeSupported: true,
  },
];

export interface UserIntegration {
  id: string;
  userId: string;
  providerId: CloudProvider['id'];
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  accountEmail?: string;
  accountName?: string;
  filesImported: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlanId = 'free' | 'pro' | 'team';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  popular?: boolean;
  cta: string;
  features: PlanFeature[];
  storage: {
    tier: StorageTier;
    chatHistoryLimit: number | 'unlimited';
    integrationsLimit: number | 'unlimited';
    storageGB: number | 'unlimited';
  };
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For students getting started',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    cta: 'Get started',
    features: [
      { text: 'AI coach (50 messages / month)', included: true },
      { text: 'Proof cards (up to 5)', included: true },
      { text: 'Past chats saved on this device', included: true, highlight: true },
      { text: 'Cloud storage connectors', included: false },
      { text: 'Cloud-synced chat history', included: false },
      { text: 'Portfolio scoring', included: false },
    ],
    storage: {
      tier: 'local',
      chatHistoryLimit: 20,
      integrationsLimit: 0,
      storageGB: 0,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For serious job hunters',
    priceMonthly: 12,
    priceYearly: 108,
    currency: 'USD',
    popular: true,
    cta: 'Upgrade to Pro',
    features: [
      { text: 'Unlimited AI coach messages', included: true },
      { text: 'Unlimited proof cards', included: true },
      { text: 'Cloud-synced chat history (forever)', included: true, highlight: true },
      { text: 'Cloud storage connectors (Drive, Dropbox, OneDrive, Notion, GitHub)', included: true, highlight: true },
      { text: 'Portfolio scoring & skill gap reports', included: true },
      { text: 'Priority AI models', included: true },
    ],
    storage: {
      tier: 'cloud',
      chatHistoryLimit: 'unlimited',
      integrationsLimit: 'unlimited',
      storageGB: 10,
    },
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For career services & clubs',
    priceMonthly: 39,
    priceYearly: 348,
    currency: 'USD',
    cta: 'Talk to sales',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Up to 25 student seats', included: true },
      { text: 'Shared coach notes & dashboards', included: true },
      { text: 'Bulk import from LMS / career portals', included: true },
      { text: 'Custom-branded proof portfolios', included: true },
      { text: 'Dedicated onboarding', included: true },
    ],
    storage: {
      tier: 'cloud',
      chatHistoryLimit: 'unlimited',
      integrationsLimit: 'unlimited',
      storageGB: 100,
    },
  },
];

export type UsageMetric =
  | 'ai_messages'
  | 'proof_cards'
  | 'integrations'
  | 'portfolio_scores'
  | 'opportunity_matches'
  | 'cover_letters';

export interface UsageLimits {
  ai_messages: number;
  proof_cards: number;
  integrations: number;
  portfolio_scores: number;
  opportunity_matches: number;
  cover_letters: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlanId, UsageLimits> = {
  free: {
    ai_messages: 50,
    proof_cards: 5,
    integrations: 0,
    portfolio_scores: 0,
    opportunity_matches: 3,
    cover_letters: 1,
  },
  pro: {
    ai_messages: Infinity,
    proof_cards: Infinity,
    integrations: 5,
    portfolio_scores: Infinity,
    opportunity_matches: Infinity,
    cover_letters: Infinity,
  },
  team: {
    ai_messages: Infinity,
    proof_cards: Infinity,
    integrations: 5,
    portfolio_scores: Infinity,
    opportunity_matches: Infinity,
    cover_letters: Infinity,
  },
};

export const USAGE_LABELS: Record<UsageMetric, { name: string; noun: string; period: string }> = {
  ai_messages: { name: 'AI coach messages', noun: 'message', period: 'month' },
  proof_cards: { name: 'Proof cards', noun: 'proof', period: 'lifetime' },
  integrations: { name: 'Cloud connectors', noun: 'connector', period: 'lifetime' },
  portfolio_scores: { name: 'Portfolio scores', noun: 'score', period: 'month' },
  opportunity_matches: { name: 'Opportunity matches', noun: 'match', period: 'month' },
  cover_letters: { name: 'AI cover letters', noun: 'letter', period: 'month' },
};

export interface UsageRecord {
  metric: UsageMetric;
  count: number;
  periodStart: string;
  resetAt?: string;
}
