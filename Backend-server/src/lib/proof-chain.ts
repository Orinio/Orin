/**
 * Orin - ProofChain Library
 * Cryptographic proof integrity: content hashing, signing, trust tiers, chain verification.
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { supabase } from './supabase.js';
import { logger } from './logger.js';

// Platform signing key (from env, with fallback for dev)
const PLATFORM_KEY = process.env.PROOF_CHAIN_KEY || 'orin-dev-proof-chain-key-change-in-production';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProofContent {
  title: string;
  description: string | null;
  skillsExtracted: string[];
  sourceType: string;
  sourceUrl: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ChainEvent {
  id: string;
  proofId: string;
  eventType: 'created' | 'verified' | 'updated' | 'signed' | 'anchored';
  contentHash: string;
  previousHash: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type TrustTier = 'none' | 'bronze' | 'silver' | 'gold';

export interface IntegrityResult {
  valid: boolean;
  currentHash: string;
  storedHash: string | null;
  chainValid: boolean;
  eventCount: number;
}

// ─── Content Hashing ─────────────────────────────────────────────────────────

/**
 * Compute SHA-256 content hash from proof card data.
 * Deterministic: same inputs always produce same hash.
 */
export function computeContentHash(proof: ProofContent): string {
  const payload = JSON.stringify({
    t: proof.title,
    d: proof.description || '',
    s: proof.skillsExtracted.sort(),
    st: proof.sourceType,
    u: proof.sourceUrl || '',
    m: proof.metadata || {},
  });

  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Compute hash of a previous proof for chain linking.
 */
export function computePreviousHash(hash: string): string {
  return createHash('sha256').update(`prev:${hash}`).digest('hex');
}

// ─── Digital Signatures ──────────────────────────────────────────────────────

/**
 * Sign a proof content hash with the platform key.
 */
export function signProof(contentHash: string): string {
  return createHmac('sha256', PLATFORM_KEY).update(contentHash).digest('hex');
}

/**
 * Verify a proof signature against its content hash.
 */
export function verifySignature(contentHash: string, signature: string): boolean {
  const expected = signProof(contentHash);
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ─── Trust Tier Calculation ──────────────────────────────────────────────────

export interface TrustTierInput {
  isVerified: boolean;
  hasDescription: boolean;
  skillCount: number;
  hasContentHash: boolean;
  isSigned: boolean;
  confidenceScore: number;
}

/**
 * Determine trust tier based on verification depth.
 *
 * Bronze: Source verified + has description
 * Silver: Bronze + AI analyzed (3+ skills) + has content hash
 * Gold: Silver + signed + confidence >= 80
 */
export function computeTrustTier(input: TrustTierInput): TrustTier {
  const { isVerified, hasDescription, skillCount, hasContentHash, isSigned, confidenceScore } = input;

  // Bronze: basic verification
  if (!isVerified || !hasDescription) return 'none';
  if (skillCount < 1) return 'none';

  // Silver: AI analyzed + hashed
  if (skillCount < 3 || !hasContentHash) return 'bronze';

  // Gold: fully proven
  if (!isSigned || confidenceScore < 80) return 'silver';

  return 'gold';
}

/**
 * Get human-readable label for trust tier.
 */
export function getTrustTierLabel(tier: TrustTier): string {
  switch (tier) {
    case 'gold': return 'Cryptographically Proven';
    case 'silver': return 'AI Analyzed';
    case 'bronze': return 'Source Verified';
    case 'none': return 'Unverified';
  }
}

/**
 * Get color for trust tier badge.
 */
export function getTrustTierColor(tier: TrustTier): { bg: string; text: string; border: string } {
  switch (tier) {
    case 'gold':
      return { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B' };
    case 'silver':
      return { bg: '#E0E7FF', text: '#4F46E5', border: '#6366F1' };
    case 'bronze':
      return { bg: '#FED7AA', text: '#C2410C', border: '#EA580C' };
    case 'none':
      return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
  }
}

// ─── Chain Operations ────────────────────────────────────────────────────────

/**
 * Initialize the chain for a new proof: compute hash, sign, store first event.
 */
export async function initializeChain(
  proofId: string,
  proof: ProofContent
): Promise<{ contentHash: string; signature: string }> {
  const contentHash = computeContentHash(proof);
  const signature = signProof(contentHash);

  // Update proof card with hash and signature
  await supabase
    .from('proof_cards')
    .update({
      content_hash: contentHash,
      signature,
      chain_version: 1,
    })
    .eq('id', proofId);

  // Log chain creation event
  await supabase.from('proof_chain_events').insert({
    proof_id: proofId,
    event_type: 'created',
    content_hash: contentHash,
    previous_hash: null,
    metadata: { source: proof.sourceType },
  });

  logger.info({ proofId, contentHash: contentHash.slice(0, 12) }, 'Proof chain initialized');
  return { contentHash, signature };
}

/**
 * Update the chain when a proof is modified: recompute hash, link to previous.
 */
export async function updateChain(
  proofId: string,
  proof: ProofContent,
  previousHash: string
): Promise<{ contentHash: string; signature: string }> {
  const contentHash = computeContentHash(proof);
  const signature = signProof(contentHash);

  await supabase
    .from('proof_cards')
    .update({
      content_hash: contentHash,
      signature,
      chain_version: 1, // Will be incremented by trigger or manual
    })
    .eq('id', proofId);

  await supabase.from('proof_chain_events').insert({
    proof_id: proofId,
    event_type: 'updated',
    content_hash: contentHash,
    previous_hash: previousHash,
    metadata: { previousHash },
  });

  return { contentHash, signature };
}

/**
 * Verify the integrity of a proof's chain.
 */
export async function verifyChainIntegrity(proofId: string): Promise<IntegrityResult> {
  // Fetch proof card
  const { data: proof } = await supabase
    .from('proof_cards')
    .select('content_hash, signature, title, description, skills_extracted, source_type, source_url, metadata')
    .eq('id', proofId)
    .single();

  if (!proof) {
    return { valid: false, currentHash: '', storedHash: null, chainValid: false, eventCount: 0 };
  }

  // Fetch chain events
  const { data: events } = await supabase
    .from('proof_chain_events')
    .select('*')
    .eq('proof_id', proofId)
    .order('created_at', { ascending: true });

  const eventCount = events?.length || 0;

  // Recompute hash from current content
  const currentHash = computeContentHash({
    title: proof.title,
    description: proof.description,
    skillsExtracted: proof.skills_extracted || [],
    sourceType: proof.source_type,
    sourceUrl: proof.source_url,
    metadata: proof.metadata,
  });

  const storedHash = proof.content_hash;
  const hashMatch = storedHash ? currentHash === storedHash : false;

  // Verify chain links
  let chainValid = true;
  if (events && events.length > 1) {
    for (let i = 1; i < events.length; i++) {
      if (events[i].previous_hash !== events[i - 1].content_hash) {
        chainValid = false;
        break;
      }
    }
  }

  // Verify signature if present
  const sigValid = proof.signature ? verifySignature(currentHash, proof.signature) : true;

  return {
    valid: hashMatch && chainValid && sigValid,
    currentHash,
    storedHash,
    chainValid,
    eventCount,
  };
}

/**
 * Get the full chain history for a proof.
 */
export async function getProofChain(proofId: string): Promise<ChainEvent[]> {
  const { data: events } = await supabase
    .from('proof_chain_events')
    .select('*')
    .eq('proof_id', proofId)
    .order('created_at', { ascending: true });

  return (events || []).map((e) => ({
    id: e.id,
    proofId: e.proof_id,
    eventType: e.event_type,
    contentHash: e.content_hash,
    previousHash: e.previous_hash,
    metadata: e.metadata || {},
    createdAt: e.created_at,
  }));
}

/**
 * Batch compute trust tiers for a user's proofs.
 */
export async function computeAllTrustTiers(userId: string): Promise<void> {
  const { data: proofs } = await supabase
    .from('proof_cards')
    .select('id, verification_status, description, skills_extracted, content_hash, signature')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (!proofs) return;

  for (const proof of proofs) {
    const tier = computeTrustTier({
      isVerified: proof.verification_status === 'verified',
      hasDescription: !!proof.description,
      skillCount: (proof.skills_extracted || []).length,
      hasContentHash: !!proof.content_hash,
      isSigned: !!proof.signature,
      confidenceScore: 75, // Default; caller should pass actual if available
    });

    await supabase
      .from('proof_cards')
      .update({ trust_tier: tier })
      .eq('id', proof.id);
  }
}
