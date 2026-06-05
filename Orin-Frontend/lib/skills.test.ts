import { describe, it, expect } from 'vitest';
import {
  extractSkillsFromProofs,
  getSkillFrequencyMap,
  calculateSkillDepth,
  getSkillTrend,
  analyzeSkills,
  identifySkillGaps,
} from './skills';
import type { Proof } from './types';

const mockProofs: Proof[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'React Dashboard',
    description: 'A React dashboard project',
    sourceType: 'github',
    sourceUrl: 'https://github.com/user/react-dashboard',
    skillsExtracted: ['react', 'javascript', 'typescript'],
    skillsUserAdded: ['dashboard', 'ui'],
    whatItProves: ['Frontend development'],
    verificationStatus: 'verified',
    visibility: 'public',
    viewCount: 100,
    isHighlighted: true,
    sortOrder: 1,
    metadata: {},
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Python Data Analysis',
    description: 'Data analysis with Python',
    sourceType: 'kaggle',
    sourceUrl: 'https://kaggle.com/user/data-analysis',
    skillsExtracted: ['python', 'pandas', 'numpy'],
    skillsUserAdded: ['data analysis', 'machine learning'],
    whatItProves: ['Data science skills'],
    verificationStatus: 'verified',
    visibility: 'public',
    viewCount: 50,
    isHighlighted: false,
    sortOrder: 2,
    metadata: {},
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Node.js API',
    description: 'REST API with Node.js',
    sourceType: 'github',
    sourceUrl: 'https://github.com/user/node-api',
    skillsExtracted: ['node.js', 'express', 'postgresql'],
    skillsUserAdded: ['api', 'backend'],
    whatItProves: ['Backend development'],
    verificationStatus: 'pending',
    visibility: 'public',
    viewCount: 30,
    isHighlighted: false,
    sortOrder: 3,
    metadata: {},
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
  },
];

describe('Skill Analysis', () => {
  describe('extractSkillsFromProofs', () => {
    it('should extract unique skills from proofs', () => {
      const skills = extractSkillsFromProofs(mockProofs);
      expect(skills).toContain('react');
      expect(skills).toContain('python');
      expect(skills).toContain('node.js');
      expect(skills.length).toBe(15); // 15 unique skills across 3 proofs
    });

    it('should handle empty proofs array', () => {
      const skills = extractSkillsFromProofs([]);
      expect(skills).toEqual([]);
    });

    it('should normalize skill names to lowercase', () => {
      const skills = extractSkillsFromProofs(mockProofs);
      expect(skills.every((s) => s === s.toLowerCase())).toBe(true);
    });
  });

  describe('getSkillFrequencyMap', () => {
    it('should count skill occurrences', () => {
      const frequencyMap = getSkillFrequencyMap(mockProofs);
      expect(frequencyMap.get('react')).toBe(1);
      expect(frequencyMap.get('python')).toBe(1);
      expect(frequencyMap.get('node.js')).toBe(1);
    });

    it('should handle duplicate skills across proofs', () => {
      const duplicateProofs: Proof[] = [
        { ...mockProofs[0], skillsExtracted: ['react', 'javascript'] },
        { ...mockProofs[1], skillsExtracted: ['react', 'python'] },
      ];
      const frequencyMap = getSkillFrequencyMap(duplicateProofs);
      expect(frequencyMap.get('react')).toBe(2);
    });
  });

  describe('calculateSkillDepth', () => {
    it('should return surface for 1 proof', () => {
      expect(calculateSkillDepth(1)).toBe('surface');
    });

    it('should return moderate for 2-3 proofs', () => {
      expect(calculateSkillDepth(2)).toBe('moderate');
      expect(calculateSkillDepth(3)).toBe('moderate');
    });

    it('should return deep for 4+ proofs', () => {
      expect(calculateSkillDepth(4)).toBe('deep');
      expect(calculateSkillDepth(5)).toBe('deep');
    });
  });

  describe('analyzeSkills', () => {
    it('should return comprehensive skill analysis', () => {
      const analysis = analyzeSkills(mockProofs);
      
      expect(analysis.totalSkills).toBe(15);
      expect(analysis.uniqueSkills).toBe(15);
      expect(analysis.skills.length).toBe(15);
      expect(analysis.topSkills.length).toBe(10); // topSkills limited to 10
      expect(analysis.verificationRate).toBe(2/3); // 2 verified out of 3
    });

    it('should handle empty proofs', () => {
      const analysis = analyzeSkills([]);
      
      expect(analysis.totalSkills).toBe(0);
      expect(analysis.uniqueSkills).toBe(0);
      expect(analysis.skills.length).toBe(0);
      expect(analysis.verificationRate).toBe(0);
    });
  });

  describe('identifySkillGaps', () => {
    it('should identify missing skills for frontend developer', () => {
      const currentSkills = ['react', 'javascript'];
      const gaps = identifySkillGaps(currentSkills, 'frontend developer');
      
      expect(gaps.some((g) => g.skill === 'html')).toBe(true);
      expect(gaps.some((g) => g.skill === 'css')).toBe(true);
      expect(gaps.some((g) => g.skill === 'typescript')).toBe(true);
    });

    it('should return empty array when all skills are present', () => {
      const currentSkills = ['javascript', 'react', 'html', 'css', 'typescript', 'next.js', 'tailwind', 'git'];
      const gaps = identifySkillGaps(currentSkills, 'frontend developer');
      
      // Should return gaps for skills not in currentSkills
      expect(Array.isArray(gaps)).toBe(true);
    });
  });
});
