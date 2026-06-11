'use client';

import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, Info } from 'lucide-react';

interface ConfidenceScoreProps {
  score: number;
  showDetails?: boolean;
  compact?: boolean;
}

function getConfidenceColor(score: number): string {
  if (score >= 70) return 'var(--color-bloom)';
  if (score >= 40) return 'var(--color-ember)';
  return 'var(--color-pulse)';
}

function getConfidenceLabel(score: number): string {
  if (score >= 70) return 'High Confidence';
  if (score >= 40) return 'Medium Confidence';
  return 'Low Confidence';
}

function getConfidenceIcon(score: number) {
  if (score >= 70) return ShieldCheck;
  if (score >= 40) return Shield;
  return ShieldAlert;
}

export function ConfidenceBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  const color = getConfidenceColor(score);
  const label = getConfidenceLabel(score);
  const Icon = getConfidenceIcon(score);

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-3 w-3" />
        {score}%
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
      style={{ backgroundColor: `${color}15`, color }}
    >
      <Icon className="h-4 w-4" />
      {label} ({score}%)
    </span>
  );
}

export function ConfidenceCard({ score, showDetails = false }: ConfidenceScoreProps) {
  const color = getConfidenceColor(score);
  const label = getConfidenceLabel(score);
  const Icon = getConfidenceIcon(score);

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              {label}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Based on verification, source, and engagement
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold" style={{ color }}>{score}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>
            Confidence Factors
          </p>
          <div className="space-y-1.5">
            {[
              { label: 'Verification', impact: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low' },
              { label: 'Source Reliability', impact: score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low' },
              { label: 'Engagement', impact: score >= 50 ? 'High' : 'Low' },
            ].map((factor) => (
              <div key={factor.label} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--color-text-tertiary)' }}>{factor.label}</span>
                <span style={{ color: 'var(--color-ink)' }}>{factor.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfidenceCard;
