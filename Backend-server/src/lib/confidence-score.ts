/**
 * Orin - Confidence Score Calculator
 * Calculates confidence scores for proof cards based on verification and source reliability.
 */

export interface ConfidenceFactors {
  isVerified: boolean;
  hasSourceUrl: boolean;
  sourceType: string;
  skillCount: number;
  hasDescription: boolean;
  proofAge: number; // days since creation
  viewCount: number;
  shareCount: number;
}

export interface ConfidenceScore {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

// Source reliability weights
const SOURCE_RELIABILITY: Record<string, number> = {
  github: 0.95,
  kaggle: 0.90,
  certificate: 0.85,
  linkedin: 0.80,
  behance: 0.75,
  dribbble: 0.75,
  medium: 0.70,
  researchgate: 0.85,
  youtube: 0.65,
  other: 0.50,
};

/**
 * Calculate confidence score for a proof card
 */
export function calculateConfidenceScore(factors: ConfidenceFactors): ConfidenceScore {
  let score = 0;

  // 1. Verification status (0-30 points)
  if (factors.isVerified) {
    score += 30;
  }

  // 2. Source reliability (0-25 points)
  const sourceWeight = SOURCE_RELIABILITY[factors.sourceType] || 0.5;
  score += Math.round(25 * sourceWeight);

  // 3. Has source URL (0-15 points)
  if (factors.hasSourceUrl) {
    score += 15;
  }

  // 4. Description quality (0-10 points)
  if (factors.hasDescription) {
    score += 10;
  }

  // 5. Skill extraction (0-10 points)
  if (factors.skillCount >= 3) {
    score += 10;
  } else if (factors.skillCount >= 1) {
    score += 5;
  }

  // 6. Recency bonus (0-5 points)
  if (factors.proofAge <= 30) {
    score += 5;
  } else if (factors.proofAge <= 90) {
    score += 3;
  }

  // 7. Engagement bonus (0-5 points)
  if (factors.viewCount >= 100) {
    score += 5;
  } else if (factors.viewCount >= 50) {
    score += 3;
  } else if (factors.viewCount >= 10) {
    score += 1;
  }

  // Cap at 100
  score = Math.min(100, score);

  // Determine level
  let level: 'high' | 'medium' | 'low';
  if (score >= 70) {
    level = 'high';
  } else if (score >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }

  // Generate factor details
  const factorDetails = [
    {
      name: 'Verification',
      impact: factors.isVerified ? 30 : 0,
      description: factors.isVerified ? 'Proof is verified against source' : 'Proof not yet verified',
    },
    {
      name: 'Source Reliability',
      impact: Math.round(25 * sourceWeight),
      description: `${factors.sourceType} has ${Math.round(sourceWeight * 100)}% reliability score`,
    },
    {
      name: 'Source Link',
      impact: factors.hasSourceUrl ? 15 : 0,
      description: factors.hasSourceUrl ? 'Direct link to source provided' : 'No source link',
    },
    {
      name: 'Description',
      impact: factors.hasDescription ? 10 : 0,
      description: factors.hasDescription ? 'Detailed description provided' : 'No description',
    },
    {
      name: 'Skills',
      impact: factors.skillCount >= 3 ? 10 : factors.skillCount >= 1 ? 5 : 0,
      description: `${factors.skillCount} skills extracted`,
    },
    {
      name: 'Recency',
      impact: factors.proofAge <= 30 ? 5 : factors.proofAge <= 90 ? 3 : 0,
      description: factors.proofAge <= 30 ? 'Created within 30 days' : `${factors.proofAge} days old`,
    },
  ];

  return {
    score,
    level,
    factors: factorDetails,
  };
}

/**
 * Get confidence color based on score
 */
export function getConfidenceColor(score: number): string {
  if (score >= 70) return 'var(--color-bloom)';
  if (score >= 40) return 'var(--color-ember)';
  return 'var(--color-pulse)';
}

/**
 * Get confidence label based on score
 */
export function getConfidenceLabel(score: number): string {
  if (score >= 70) return 'High Confidence';
  if (score >= 40) return 'Medium Confidence';
  return 'Low Confidence';
}
