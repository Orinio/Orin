import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillBadgeProps {
  skill: string;
  count?: number;
  verified?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'outline';
}

export default function SkillBadge({
  skill,
  count,
  verified = false,
  size = 'sm',
  variant = 'default',
}: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        variant === 'default' ? 'badge-bloom' : 'badge-outline-bloom',
      )}
    >
      {verified && <BadgeCheck className="w-3 h-3 fill-emerald-500 text-white" />}
      {skill}
      {count !== undefined && (
        <span className="ml-0.5 opacity-60">×{count}</span>
      )}
    </span>
  );
}
