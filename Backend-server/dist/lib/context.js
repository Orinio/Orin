"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentContext = buildAgentContext;
exports.invalidateContextCache = invalidateContextCache;
const supabase_js_1 = require("./supabase.js");
const skills_js_1 = require("./skills.js");
const logger_js_1 = require("./logger.js");
/**
 * Build the AI agent context for a given auth user ID.
 * Shared by ai.ts and coach.ts to eliminate duplication.
 *
 * Queries: users + proof_cards + opportunities (3 DB calls, cached for 60s per user).
 * Returns enriched context with full user profile, skills, proofs, and opportunities.
 */
const contextCache = new Map();
const CACHE_TTL_MS = 60_000; // 60 seconds
async function buildAgentContext(authUserId) {
    const now = Date.now();
    const cached = contextCache.get(authUserId);
    if (cached && cached.expiresAt > now) {
        return cached.context;
    }
    const { data: userProfile, error: userError } = await supabase_js_1.supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();
    if (userError || !userProfile) {
        logger_js_1.logger.warn({ authUserId, error: userError }, 'User profile not found for context build');
        // Return minimal context with auth user ID as fallback
        return {
            userId: authUserId,
            userProfile: null,
            proofs: [],
            skillAnalysis: (0, skills_js_1.analyzeSkills)([]),
        };
    }
    const { data: proofs } = await supabase_js_1.supabase
        .from('proof_cards')
        .select('*')
        .eq('user_id', userProfile.id)
        .is('deleted_at', null);
    const skillAnalysis = (0, skills_js_1.analyzeSkills)(proofs || []);
    const userSkills = (0, skills_js_1.extractSkillsFromProofs)(proofs || []);
    // Fetch opportunities for richer context
    const { data: opportunities } = await supabase_js_1.supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
    // Calculate opportunity matches
    const userSkillsSet = new Set(userSkills.map(s => s.toLowerCase()));
    const matchedOpportunities = (opportunities || []).map(opp => {
        const required = (opp.required_skills || []).map((s) => s.toLowerCase());
        const nice = (opp.nice_to_have || []).map((s) => s.toLowerCase());
        const matchedRequired = required.filter((s) => userSkillsSet.has(s));
        const matchedNice = nice.filter((s) => userSkillsSet.has(s));
        const score = Math.round(((matchedRequired.length * 1.0 + matchedNice.length * 0.3) /
            (required.length * 1.0 + nice.length * 0.3)) * 100);
        return {
            id: opp.id,
            title: opp.title,
            company: opp.company,
            type: opp.type,
            matchScore: Math.min(100, Math.max(0, score || 0)),
            matchedSkills: [...matchedRequired, ...matchedNice],
            missingSkills: required.filter((s) => !userSkillsSet.has(s)),
        };
    }).sort((a, b) => b.matchScore - a.matchScore);
    const context = {
        userId: userProfile.id,
        userProfile: {
            ...userProfile,
            extractedSkills: userSkills,
            matchedOpportunities: matchedOpportunities.slice(0, 5),
            proofCount: (proofs || []).length,
            verifiedCount: (proofs || []).filter((p) => p.verification_status === 'verified').length,
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
function invalidateContextCache(authUserId) {
    contextCache.delete(authUserId);
}
//# sourceMappingURL=context.js.map