import type { Proof, ProofSourceType } from './types';
export interface SkillInfo {
    name: string;
    count: number;
    depth: 'surface' | 'moderate' | 'deep';
    sources: ProofSourceType[];
    lastUsed: Date;
    trend: 'improving' | 'stable' | 'declining';
}
export interface SkillGap {
    skill: string;
    importance: 'critical' | 'important' | 'nice_to_have';
    currentLevel: number;
    targetLevel: number;
}
export interface SkillAnalysis {
    totalSkills: number;
    uniqueSkills: number;
    skills: SkillInfo[];
    topSkills: SkillInfo[];
    skillGaps: SkillGap[];
    proofTypeDistribution: Record<ProofSourceType, number>;
    averageProofsPerSkill: number;
    verificationRate: number;
}
export declare function extractSkillsFromProofs(proofs: Proof[]): string[];
export declare function getSkillFrequencyMap(proofs: Proof[]): Map<string, number>;
export declare function calculateSkillDepth(proofCount: number): 'surface' | 'moderate' | 'deep';
export declare function getSkillTrend(proofs: Proof[], skill: string): 'improving' | 'stable' | 'declining';
export declare function getSkillsByCategory(proofs: Proof[]): Map<string, string[]>;
export declare function identifySkillGaps(currentSkills: string[], targetRole?: string): SkillGap[];
export declare function analyzeSkills(proofs: Proof[], targetRole?: string): SkillAnalysis;
export declare function getSkillRecommendations(analysis: SkillAnalysis): {
    skill: string;
    reason: string;
    priority: number;
}[];
//# sourceMappingURL=skills.d.ts.map