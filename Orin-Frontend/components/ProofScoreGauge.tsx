'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ProofScoreGaugeProps {
  score: number; // 0-100
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'var(--color-bloom)';
  if (score >= 60) return 'var(--color-ember)';
  if (score >= 40) return 'var(--color-spark)';
  return 'var(--color-pulse)';
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Growing';
  if (score >= 20) return 'Getting started';
  return 'Just beginning';
};

const getScoreGradient = (score: number): [string, string] => {
  if (score >= 80) return ['#0BAB77', '#0A9A6A'];
  if (score >= 60) return ['#F69226', '#E08215'];
  if (score >= 40) return ['#F4E409', '#E6D608'];
  return ['#EE4266', '#D63A5B'];
};

export default function ProofScoreGauge({ score, label, size = 'lg' }: ProofScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const dimensions = {
    sm: { width: 120, height: 80, strokeWidth: 10, fontSize: 24, labelSize: 10 },
    md: { width: 180, height: 110, strokeWidth: 14, fontSize: 32, labelSize: 12 },
    lg: { width: 240, height: 140, strokeWidth: 18, fontSize: 42, labelSize: 14 },
  };

  const { width, height, strokeWidth, fontSize, labelSize } = dimensions[size];
  const cx = width / 2;
  const cy = height - 10;
  const radius = (Math.min(width, height * 2) - strokeWidth) / 2 - 10;

  // Arc parameters (270 degree arc, from -225 to 45 degrees)
  const startAngle = -225 * (Math.PI / 180);
  const endAngle = 45 * (Math.PI / 180);
  const totalAngle = endAngle - startAngle;
  const sweepAngle = totalAngle * (animatedScore / 100);

  const arcStartX = cx + radius * Math.cos(startAngle);
  const arcStartY = cy + radius * Math.sin(startAngle);
  const arcEndX = cx + radius * Math.cos(startAngle + sweepAngle);
  const arcEndY = cy + radius * Math.sin(startAngle + sweepAngle);

  const largeArc = sweepAngle > Math.PI ? 1 : 0;

  const pathD = animatedScore > 0
    ? `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`
    : '';

  // Background arc (full 270 degrees)
  const bgEndX = cx + radius * Math.cos(endAngle);
  const bgEndY = cy + radius * Math.sin(endAngle);
  const bgPath = `M ${arcStartX} ${arcStartY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`;

  const color = getScoreColor(score);
  const [gradStart, gradEnd] = getScoreGradient(score);
  const gradientId = `gauge-gradient-${size}`;
  const trackId = `gauge-track-${size}`;

  // Tick marks
  const ticks = [];
  const numTicks = 10;
  for (let i = 0; i <= numTicks; i++) {
    const tickAngle = startAngle + (totalAngle * i) / numTicks;
    const innerR = radius - strokeWidth / 2 - 4;
    const outerR = radius - strokeWidth / 2 - 12;
    const x1 = cx + innerR * Math.cos(tickAngle);
    const y1 = cy + innerR * Math.sin(tickAngle);
    const x2 = cx + outerR * Math.cos(tickAngle);
    const y2 = cy + outerR * Math.sin(tickAngle);
    ticks.push({ x1, y1, x2, y2, index: i });
  }

  useEffect(() => {
    let start: number;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradStart} />
              <stop offset="100%" stopColor={gradEnd} />
            </linearGradient>
            <filter id={`${trackId}-glow`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <path
            d={bgPath}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {ticks.map((tick) => (
            <line
              key={tick.index}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="var(--color-text-tertiary)"
              strokeWidth={1.5}
              opacity={tick.index * 10 <= animatedScore ? 0.8 : 0.2}
            />
          ))}

          {/* Score arc */}
          {animatedScore > 0 && (
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter={`url(#${trackId}-glow)`}
            />
          )}

          {/* Center score */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={fontSize}
            fontWeight="800"
            fontFamily="var(--font-heading)"
          >
            {animatedScore}
          </text>

          {/* Score label */}
          <text
            x={cx}
            y={cy + fontSize / 2 + 4}
            textAnchor="middle"
            fill="var(--color-text-tertiary)"
            fontSize={labelSize}
            fontWeight="600"
            fontFamily="var(--font-body)"
          >
            {label || getScoreLabel(score)}
          </text>
        </svg>
      </div>
    </div>
  );
}
