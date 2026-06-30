'use client';

import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export type TrustTier = 'none' | 'bronze' | 'silver' | 'gold';

interface TrustTierBadgeProps {
  tier: TrustTier;
  confidence?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG: Record<TrustTier, {
  label: string;
  sublabel: string;
  icon: typeof Shield;
  bg: string;
  text: string;
  border: string;
  glow: string;
}> = {
  gold: {
    label: 'Gold',
    sublabel: 'Cryptographically Proven',
    icon: ShieldCheck,
    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    text: '#92400E',
    border: '#F59E0B',
    glow: '0 0 12px rgba(245, 158, 11, 0.3)',
  },
  silver: {
    label: 'Silver',
    sublabel: 'AI Analyzed',
    icon: Shield,
    bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)',
    text: '#3730A3',
    border: '#6366F1',
    glow: '0 0 12px rgba(99, 102, 241, 0.3)',
  },
  bronze: {
    label: 'Bronze',
    sublabel: 'Source Verified',
    icon: ShieldAlert,
    bg: 'linear-gradient(135deg, #FED7AA 0%, #FDBA74 100%)',
    text: '#9A3412',
    border: '#EA580C',
    glow: '0 0 12px rgba(234, 88, 12, 0.3)',
  },
  none: {
    label: 'Unverified',
    sublabel: 'No verification',
    icon: ShieldX,
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#D1D5DB',
    glow: 'none',
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
};

export default function TrustTierBadge({ tier, confidence, showDetails = false, size = 'md' }: TrustTierBadgeProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        className={`inline-flex items-center rounded-full font-semibold ${SIZE_CLASSES[size]}`}
        style={{
          background: config.bg,
          color: config.text,
          border: `1px solid ${config.border}`,
          boxShadow: config.glow,
        }}
      >
        <Icon size={ICON_SIZES[size]} />
        <span>{config.label}</span>
        {confidence !== undefined && tier !== 'none' && (
          <span className="opacity-70">({confidence}%)</span>
        )}
      </div>
      {showDetails && tier !== 'none' && (
        <span className="text-[10px] text-gray-500 ml-1">{config.sublabel}</span>
      )}
    </div>
  );
}

/**
 * Compact trust indicator for inline use (e.g., in proof card headers).
 */
export function TrustTierIndicator({ tier }: { tier: TrustTier }) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  if (tier === 'none') return null;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        backgroundColor: `${config.border}20`,
        color: config.text,
      }}
      title={config.sublabel}
    >
      <Icon size={10} />
      <span>{config.label}</span>
    </div>
  );
}
