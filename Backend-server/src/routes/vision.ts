import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { isNvidiaConfigured } from '../lib/ai/core/nvidia.js';
import { 
  analyzeImage, 
  extractCertificateInfo, 
  verifyCertificate,
  analyzeScreenshot 
} from '../lib/ai/services/vision.service.js';
import { supabase } from '../lib/supabase.js';
import { userRateLimitMiddleware } from '../middleware/rate-limit.js';

export const visionRouter = Router();

/**
 * POST /ai/vision/analyze - Analyze an image
 */
visionRouter.post('/analyze', userRateLimitMiddleware('ai-vision'), async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { imageUrl, prompt, model } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
      return;
    }

    const result = await analyzeImage(imageUrl, prompt, model);

    res.json({
      success: true,
      data: {
        content: result.content,
        tokensUsed: result.tokensUsed,
        durationMs: result.durationMs
      }
    });
  } catch (error) {
    logger.error({ error }, 'Image analysis failed');
    res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to analyze image' } });
  }
});

/**
 * POST /ai/vision/certificate/extract - Extract certificate information
 */
visionRouter.post('/certificate/extract', userRateLimitMiddleware('ai-vision-extract'), async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { imageUrl, model } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
      return;
    }

    const certInfo = await extractCertificateInfo(imageUrl, model);

    res.json({
      success: true,
      data: certInfo
    });
  } catch (error) {
    logger.error({ error }, 'Certificate extraction failed');
    res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to extract certificate info' } });
  }
});

/**
 * POST /ai/vision/certificate/verify - Verify a certificate
 */
visionRouter.post('/certificate/verify', userRateLimitMiddleware('ai-vision-verify'), async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { imageUrl, expectedIssuer, proofId, model } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
      return;
    }

    const result = await verifyCertificate(imageUrl, expectedIssuer, model);

    // Update proof status if proofId provided
    if (proofId) {
      const userId = (req as any).user?.id;
      if (userId) {
        const { data: existingProof } = await supabase
          .from('proof_cards')
          .select('metadata')
          .eq('id', proofId)
          .eq('user_id', userId)
          .single();

        await supabase
          .from('proof_cards')
          .update({
            verification_status: result.verified ? 'verified' : 'rejected',
            verified_at: result.verified ? new Date().toISOString() : null,
            metadata: {
              ...((existingProof as any)?.metadata || {}),
              verification: {
                ...(((existingProof as any)?.metadata as any)?.verification || {}),
                verified: result.verified,
                confidence: result.confidence,
                certificateInfo: result.certificateInfo,
                reasons: result.reasons,
                timestamp: new Date().toISOString(),
                model: model
              }
            }
          })
          .eq('id', proofId)
          .eq('user_id', userId);
      }
    }

    res.json({
      success: true,
      data: {
        verified: result.verified,
        confidence: result.confidence,
        certificateInfo: result.certificateInfo,
        reasons: result.reasons
      }
    });
  } catch (error) {
    logger.error({ error }, 'Certificate verification failed');
    res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to verify certificate' } });
  }
});

/**
 * POST /ai/vision/screenshot - Analyze a screenshot for proof
 */
visionRouter.post('/screenshot', userRateLimitMiddleware('ai-vision-screenshot'), async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { imageUrl, proofType, model } = req.body;

    if (!imageUrl) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
      return;
    }

    const result = await analyzeScreenshot(imageUrl, proofType, model);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, 'Screenshot analysis failed');
    res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to analyze screenshot' } });
  }
});
