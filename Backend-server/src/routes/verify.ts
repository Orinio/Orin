/**
 * Orin - ProofChain Verify Route
 * Public endpoint for verifying proof authenticity via content hash.
 */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';
import { verifyChainIntegrity, getProofChain, computeContentHash } from '../lib/proof-chain.js';

export const verifyRouter = Router();

/**
 * GET /verify/:hash
 * Public endpoint — no auth required.
 * Returns proof card details + chain integrity status.
 */
verifyRouter.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length < 16) {
      res.status(400).json({
        error: { code: 'INVALID_HASH', message: 'Hash must be at least 16 characters' },
      });
      return;
    }

    // Find proof by content hash
    const { data: proof, error: fetchError } = await supabase
      .from('proof_cards')
      .select(`
        id, title, description, source_type, source_url,
        skills_extracted, trust_tier, content_hash, signature,
        verification_status, verified_at, last_verified_at,
        verification_count, chain_version, created_at, updated_at,
        users:user_id (username, full_name, avatar_url)
      `)
      .eq('content_hash', hash)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      logger.error({ err: fetchError }, 'Verify query error');
      res.status(500).json({ error: { code: 'DB_ERROR', message: 'Database error' } });
      return;
    }

    if (!proof) {
      // Try partial hash match (first 16+ chars)
      const { data: partialProof } = await supabase
        .from('proof_cards')
        .select('id, content_hash')
        .like('content_hash', `${hash}%`)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();

      if (partialProof) {
        res.status(300).json({
          error: {
            code: 'PARTIAL_MATCH',
            message: 'Partial hash match found. Use the full hash for verification.',
            suggestion: partialProof.content_hash,
          },
        });
        return;
      }

      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No proof found with this content hash' },
      });
      return;
    }

    // Verify chain integrity
    const integrity = await verifyChainIntegrity(proof.id);

    // Get chain history
    const chain = await getProofChain(proof.id);

    const user = proof.users as any;

    res.json({
      success: true,
      data: {
        proof: {
          id: proof.id,
          title: proof.title,
          description: proof.description,
          sourceType: proof.source_type,
          sourceUrl: proof.source_url,
          skillsExtracted: proof.skills_extracted || [],
          trustTier: proof.trust_tier,
          verificationStatus: proof.verification_status,
          verifiedAt: proof.verified_at,
          lastVerifiedAt: proof.last_verified_at,
          verificationCount: proof.verification_count,
          chainVersion: proof.chain_version,
          createdAt: proof.created_at,
          updatedAt: proof.updated_at,
        },
        owner: user ? {
          username: user.username,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        } : null,
        integrity: {
          valid: integrity.valid,
          currentHash: integrity.currentHash,
          storedHash: integrity.storedHash,
          chainValid: integrity.chainValid,
          eventCount: integrity.eventCount,
        },
        chain: chain.map((e) => ({
          eventType: e.eventType,
          contentHash: e.contentHash.slice(0, 12) + '...',
          createdAt: e.createdAt,
        })),
        verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${hash}`,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Verify endpoint error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});

/**
 * GET /verify/proof/:proofId
 * Look up by proof ID, return hash for redirect.
 */
verifyRouter.get('/proof/:proofId', async (req, res) => {
  try {
    const { proofId } = req.params;

    const { data: proof } = await supabase
      .from('proof_cards')
      .select('id, content_hash')
      .eq('id', proofId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!proof) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Proof not found' },
      });
      return;
    }

    if (!proof.content_hash) {
      // Compute hash on-the-fly if not yet initialized
      const { data: fullProof } = await supabase
        .from('proof_cards')
        .select('title, description, skills_extracted, source_type, source_url, metadata')
        .eq('id', proofId)
        .single();

      if (!fullProof) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Proof not found' } });
        return;
      }

      const contentHash = computeContentHash({
        title: fullProof.title,
        description: fullProof.description,
        skillsExtracted: fullProof.skills_extracted || [],
        sourceType: fullProof.source_type,
        sourceUrl: fullProof.source_url,
        metadata: fullProof.metadata,
      });

      res.json({
        success: true,
        data: { proofId, contentHash, redirectUrl: `/verify/${contentHash}` },
      });
      return;
    }

    res.json({
      success: true,
      data: { proofId, contentHash: proof.content_hash, redirectUrl: `/verify/${proof.content_hash}` },
    });
  } catch (err) {
    logger.error({ err }, 'Verify by ID error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
});
