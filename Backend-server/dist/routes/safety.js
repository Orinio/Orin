"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safetyRouter = void 0;
const express_1 = require("express");
const logger_js_1 = require("../lib/logger.js");
const nvidia_js_1 = require("../lib/ai/core/nvidia.js");
const safety_service_js_1 = require("../lib/ai/services/safety.service.js");
const rate_limit_js_1 = require("../middleware/rate-limit.js");
exports.safetyRouter = (0, express_1.Router)();
/**
 * POST /ai/safety/check - Check content safety
 */
exports.safetyRouter.post('/check', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-safety-check'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { userMessage, aiResponse, model } = req.body;
        if (!userMessage) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'User message is required' } });
            return;
        }
        const result = await (0, safety_service_js_1.checkContentSafety)(userMessage, aiResponse, model);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Safety check failed');
        res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to check content safety' } });
    }
});
/**
 * POST /ai/safety/pii - Detect PII in text
 */
exports.safetyRouter.post('/pii', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-safety-pii'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { text, model } = req.body;
        if (!text) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
            return;
        }
        const result = await (0, safety_service_js_1.detectPII)(text, model);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'PII detection failed');
        res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to detect PII' } });
    }
});
/**
 * POST /ai/safety/topic - Check if content is on-topic
 */
exports.safetyRouter.post('/topic', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-safety-topic'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { text, allowedTopics, model } = req.body;
        if (!text) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
            return;
        }
        const result = await (0, safety_service_js_1.checkTopic)(text, allowedTopics, model);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Topic check failed');
        res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to check topic' } });
    }
});
/**
 * POST /ai/safety/sanitize - Sanitize text
 */
exports.safetyRouter.post('/sanitize', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-safety-sanitize'), async (req, res) => {
    try {
        const { text, type } = req.body;
        if (!text) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
            return;
        }
        const sanitized = type === 'response'
            ? (0, safety_service_js_1.sanitizeResponse)(text)
            : (0, safety_service_js_1.sanitizeInput)(text);
        res.json({
            success: true,
            data: {
                original: text,
                sanitized,
                modified: text !== sanitized
            }
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Sanitization failed');
        res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to sanitize text' } });
    }
});
/**
 * POST /ai/safety/full-check - Full safety pipeline
 */
exports.safetyRouter.post('/full-check', (0, rate_limit_js_1.userRateLimitMiddleware)('ai-safety-full'), async (req, res) => {
    try {
        if (!(0, nvidia_js_1.isNvidiaConfigured)()) {
            res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
            return;
        }
        const { userInput, aiResponse } = req.body;
        if (!userInput) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'User input is required' } });
            return;
        }
        const result = await (0, safety_service_js_1.fullSafetyCheck)(userInput, aiResponse);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'Full safety check failed');
        res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to perform safety check' } });
    }
});
//# sourceMappingURL=safety.js.map