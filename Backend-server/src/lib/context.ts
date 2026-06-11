import { supabase } from './supabase.js';
import { analyzeSkills, extractSkillsFromProofs } from './skills.js';
import { logger } from './logger.js';
import type { AgentContext } from './ai/core/types.js';

/**
 * Build the AI agent context for a given auth user ID.
 * Shared by ai.ts and coach.ts to eliminate duplication.
 *
 * Queries: users + proof_cards + opportunities (3 DB calls, cached for 60s per user).
 * Returns enriched context with full user profile, skills, proofs, and opportunities.
 */
const contextCache = new Map<string, { context: AgentContext; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function buildAgentContext(authUserId: string): Promise<AgentContext> {
  const now = Date.now();
  const cached = contextCache.get(authUserId);
  if (cached && cached.expiresAt > now) {
    return cached.context;
  }

  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (userError || !userProfile) {
    logger.warn({ authUserId, error: userError }, 'User profile not found for context build');
    return {
      userId: authUserId,
      userProfile: null,
      proofs: [],
      skillAnalysis: analyzeSkills([]),
    };
  }

  // Fetch proofs and opportunities in parallel (both only need user.id / is_active)
  const [proofsResult, opportunitiesResult] = await Promise.all([
    supabase.from('proof_cards').select('*').eq('user_id', userProfile.id).is('deleted_at', null),
    supabase.from('opportunities').select('*').eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }).limit(20),
  ]);

  const proofs = proofsResult.data || [];
  const opportunities = opportunitiesResult.data || [];
  const skillAnalysis = analyzeSkills(proofs);
  const userSkills = extractSkillsFromProofs(proofs);

  // Calculate opportunity matches
  const userSkillsSet = new Set(userSkills.map(s => s.toLowerCase()));
  const matchedOpportunities = (opportunities || []).map(opp => {
    const required = (opp.required_skills || []).map((s: string) => s.toLowerCase());
    const nice = (opp.nice_to_have || []).map((s: string) => s.toLowerCase());
    const matchedRequired = required.filter((s: string) => userSkillsSet.has(s));
    const matchedNice = nice.filter((s: string) => userSkillsSet.has(s));
    const score = Math.round(
      ((matchedRequired.length * 1.0 + matchedNice.length * 0.3) /
        (required.length * 1.0 + nice.length * 0.3)) * 100
    );
    return {
      id: opp.id,
      title: opp.title,
      company: opp.company,
      type: opp.type,
      matchScore: Math.min(100, Math.max(0, score || 0)),
      matchedSkills: [...matchedRequired, ...matchedNice],
      missingSkills: required.filter((s: string) => !userSkillsSet.has(s)),
    };
  }).sort((a: any, b: any) => b.matchScore - a.matchScore);

  const context: AgentContext = {
    userId: userProfile.id,
    userProfile: {
      ...userProfile,
      extractedSkills: userSkills,
      matchedOpportunities: matchedOpportunities.slice(0, 5),
      proofCount: (proofs || []).length,
      verifiedCount: (proofs || []).filter((p: any) => p.verification_status === 'verified').length,
    },
    proofs: proofs || [],
    skillAnalysis,
    opportunities: matchedOpportunities,
  };

  contextCache.set(authUserId, { context, expiresAt: now + CACHE_TTL_MS });

  return context;
}

/**
 * Invalidate cached context for a user (call after mutations).
 */
export function invalidateContextCache(authUserId: string): void {
  contextCache.delete(authUserId);
}
