import { describe, it, expect } from 'vitest';
import {
  extractSkillsFromProofs,
  getSkillFrequencyMap,
  calculateSkillDepth,
  identifySkillGaps,
  analyzeSkills,
} from '../src/lib/skills.js';
import type { Proof } from '../src/lib/types.js';

const mockProofs: Proof[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'React Dashboard',
    sourceType: 'github',
    skillsExtracted: ['react', 'typescript', 'tailwind'],
    skillsUserAdded: ['react', 'dashboard'],
    whatItProves: ['Frontend development'],
    verificationStatus: 'verified',
    visibility: 'public',
    viewCount: 10,
    isHighlighted: true,
    sortOrder: 0,
    metadata: {},
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Node.js API',
    sourceType: 'github',
    skillsExtracted: ['node.js', 'express', 'postgresql'],
    skillsUserAdded: ['api', 'rest'],
    whatItProves: ['Backend development'],
    verificationStatus: 'verified',
    visibility: 'public',
    viewCount: 5,
    isHighlighted: false,
    sortOrder: 1,
    metadata: {},
    createdAt: new Date('2026-02-10'),
    updatedAt: new Date('2026-02-10'),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'ML Certificate',
    sourceType: 'certificate',
    skillsExtracted: ['python', 'machine learning', 'tensorflow'],
    skillsUserAdded: ['data science'],
    whatItProves: ['ML knowledge'],
    verificationStatus: 'pending',
    visibility: 'private',
    viewCount: 0,
    isHighlighted: false,
    sortOrder: 2,
    metadata: {},
    createdAt: new Date('2026-03-05'),
    updatedAt: new Date('2026-03-05'),
  },
];

describe('Skills Analysis', () => {
  describe('extractSkillsFromProofs', () => {
    it('should extract all unique skills from proofs', () => {
      const skills = extractSkillsFromProofs(mockProofs);
      expect(skills).toContain('react');
      expect(skills).toContain('typescript');
      expect(skills).toContain('node.js');
      expect(skills).toContain('python');
      expect(skills.length).toBeGreaterThan(5);
    });

    it('should normalize skills to lowercase', () => {
      const skills = extractSkillsFromProofs(mockProofs);
      skills.forEach(skill => {
        expect(skill).toBe(skill.toLowerCase());
      });
    });

    it('should handle empty proofs array', () => {
      const skills = extractSkillsFromProofs([]);
      expect(skills).toEqual([]);
    });
  });

  describe('getSkillFrequencyMap', () => {
    it('should count skill occurrences', () => {
      const freqMap = getSkillFrequencyMap(mockProofs);
      // 'react' appears in skillsExtracted + skillsUserAdded of proof 1
      expect(freqMap.get('react')).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty proofs', () => {
      const freqMap = getSkillFrequencyMap([]);
      expect(freqMap.size).toBe(0);
    });
  });

  describe('calculateSkillDepth', () => {
    it('should return surface for 0-1 proofs', () => {
      expect(calculateSkillDepth(0)).toBe('surface');
      expect(calculateSkillDepth(1)).toBe('surface');
    });

    it('should return moderate for 2-3 proofs', () => {
      expect(calculateSkillDepth(2)).toBe('moderate');
      expect(calculateSkillDepth(3)).toBe('moderate');
    });

    it('should return deep for 4+ proofs', () => {
      expect(calculateSkillDepth(4)).toBe('deep');
      expect(calculateSkillDepth(10)).toBe('deep');
    });
  });

  describe('identifySkillGaps', () => {
    it('should identify gaps for frontend developer', () => {
      const gaps = identifySkillGaps(['react', 'javascript'], 'frontend developer');
      // Should not have gaps for skills already present
      const reactGap = gaps.find(g => g.skill === 'react');
      expect(reactGap).toBeUndefined();
    });

    it('should identify missing critical skills', () => {
      const gaps = identifySkillGaps(['python'], 'frontend developer');
      const jsGap = gaps.find(g => g.skill === 'javascript');
      expect(jsGap).toBeDefined();
      expect(jsGap?.importance).toBe('critical');
    });

    it('should default to full stack developer', () => {
      const gaps = identifySkillGaps([]);
      expect(gaps.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeSkills', () => {
    it('should return complete analysis', () => {
      const analysis = analyzeSkills(mockProofs);
      expect(analysis).toHaveProperty('totalSkills');
      expect(analysis).toHaveProperty('uniqueSkills');
      expect(analysis).toHaveProperty('skills');
      expect(analysis).toHaveProperty('topSkills');
      expect(analysis).toHaveProperty('skillGaps');
      expect(analysis).toHaveProperty('verificationRate');
      expect(analysis).toHaveProperty('proofTypeDistribution');
    });

    it('should calculate correct verification rate', () => {
      const analysis = analyzeSkills(mockProofs);
      // 2 verified out of 3
      expect(analysis.verificationRate).toBeCloseTo(2 / 3, 2);
    });

    it('should handle empty proofs', () => {
      const analysis = analyzeSkills([]);
      expect(analysis.uniqueSkills).toBe(0);
      expect(analysis.verificationRate).toBe(0);
    });

    it('should count proof type distribution', () => {
      const analysis = analyzeSkills(mockProofs);
      expect(analysis.proofTypeDistribution['github']).toBe(2);
      expect(analysis.proofTypeDistribution['certificate']).toBe(1);
    });
  });
});
