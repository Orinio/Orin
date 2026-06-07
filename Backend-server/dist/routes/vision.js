"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visionRouter = void 0;
const express_1 = require("express");
const logger_js_1 = require("../lib/logger.js");
const nvidia_js_1 = require("../lib/ai/core/nvidia.js");
const vision_service_js_1 = require("../lib/ai/services/vision.service.js");
const auth_js_1 = require("../middleware/auth.js");
const supabase_js_1 = require("../lib/supabase.js");
exports.visionRouter = (0, express_1.Router)();
/**
 * POST /ai/vision/analyze - Analyze an image
 */
exports.visionRouter.post('/analyze', auth_js_1.authMiddleware, async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { imageUrl, prompt, model } = req.body;
        if (!imageUrl) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
            return;
        }
        const result = await (0, vision_service_js_1.analyzeImage)(imageUrl, prompt, model);
        res.json({
            success: true,
            data: {
                content: result.content,
                tokensUsed: result.tokensUsed,
                durationMs: result.durationMs
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Image analysis failed');
        res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to analyze image' } });
    }
});
/**
 * POST /ai/vision/certificate/extract - Extract certificate information
 */
exports.visionRouter.post('/certificate/extract', auth_js_1.authMiddleware, async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { imageUrl, model } = req.body;
        if (!imageUrl) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
            return;
        }
        const certInfo = await (0, vision_service_js_1.extractCertificateInfo)(imageUrl, model);
        res.json({
            success: true,
            data: certInfo
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Certificate extraction failed');
        res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to extract certificate info' } });
    }
});
/**
 * POST /ai/vision/certificate/verify - Verify a certificate
 */
exports.visionRouter.post('/certificate/verify', auth_js_1.authMiddleware, async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { imageUrl, expectedIssuer, proofId, model } = req.body;
        if (!imageUrl) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
            return;
        }
        const result = await (0, vision_service_js_1.verifyCertificate)(imageUrl, expectedIssuer, model);
        // Update proof status if proofId provided
        if (proofId) {
            const userId = req.user?.id;
            if (userId) {
                await supabase_js_1.supabase
                    .from('proof_cards')
                    .update({
                    verification_status: result.verified ? 'verified' : 'rejected',
                    verified_at: result.verified ? new Date().toISOString() : null,
                    metadata: {
                        verification: {
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
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Certificate verification failed');
        res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to verify certificate' } });
    }
});
/**
 * POST /ai/vision/screenshot - Analyze a screenshot for proof
 */
exports.visionRouter.post('/screenshot', auth_js_1.authMiddleware, async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { imageUrl, proofType, model } = req.body;
        if (!imageUrl) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Image URL is required' } });
            return;
        }
        const result = await (0, vision_service_js_1.analyzeScreenshot)(imageUrl, proofType, model);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Screenshot analysis failed');
        res.status(500).json({ error: { code: 'VISION_ERROR', message: 'Failed to analyze screenshot' } });
    }
});
//# sourceMappingURL=vision.js.map