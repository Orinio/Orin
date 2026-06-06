import { supabase } from './supabase.js';
import { analyzeSkills } from './skills.js';
import { logger } from './logger.js';
import type { AgentContext } from './ai/core/types.js';

/**
 * Build the AI agent context for a given auth user ID.
 * Shared by ai.ts and coach.ts to eliminate duplication.
 *
 * Queries: users + proof_cards (2 DB calls, cached for 60s per user).
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
    // Return minimal context with auth user ID as fallback
    return {
      userId: authUserId,
      userProfile: null,
      proofs: [],
      skillAnalysis: analyzeSkills([]),
    };
  }

  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('*')
    .eq('user_id', userProfile.id)
    .is('deleted_at', null);

  const skillAnalysis = analyzeSkills(proofs || []);

  const context: AgentContext = {
    userId: userProfile.id,
    userProfile,
    proofs: proofs || [],
    skillAnalysis,
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
