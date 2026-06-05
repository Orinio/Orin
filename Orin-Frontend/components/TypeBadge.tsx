import {
  Github,
  GitFork,
  BarChart3,
  Award,
  Trophy,
  FolderOpen,
  BookOpen,
  Monitor,
  HelpCircle,
} from 'lucide-react';
import type { ProofSourceType } from '@/lib/types';

interface TypeBadgeProps {
  type: ProofSourceType;
  size?: 'sm' | 'md';
}

const typeConfig: Record<
  ProofSourceType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  github: {
    color: 'var(--color-ink)',
    icon: <GitFork className="w-3.5 h-3.5" />,
    label: 'GitHub',
  },
  kaggle: {
    color: 'var(--color-ember)',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    label: 'Kaggle',
  },
  certificate: {
    color: 'var(--color-spark)',
    icon: <Award className="w-3.5 h-3.5" />,
    label: 'Certificate',
  },
  hackathon: {
    color: 'var(--color-pulse)',
    icon: <Trophy className="w-3.5 h-3.5" />,
    label: 'Hackathon',
  },
  project: {
    color: 'var(--color-bloom)',
    icon: <FolderOpen className="w-3.5 h-3.5" />,
    label: 'Project',
  },
  blog: {
    color: '#8B5CF6',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    label: 'Blog',
  },
  demo: {
    color: '#06B6D4',
    icon: <Monitor className="w-3.5 h-3.5" />,
    label: 'Demo',
  },
  other: {
    color: 'var(--color-mist)',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    label: 'Other',
  },
};

export default function TypeBadge({ type, size = 'sm' }: TypeBadgeProps) {
  const config = typeConfig[type] || typeConfig.other;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full text-white ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      style={{ backgroundColor: config.color }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
