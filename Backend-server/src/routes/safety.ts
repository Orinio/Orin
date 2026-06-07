import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { isNvidiaConfigured } from '../lib/ai/core/nvidia.js';
import { 
  checkContentSafety, 
  detectPII, 
  checkTopic,
  sanitizeInput,
  sanitizeResponse,
  fullSafetyCheck
} from '../lib/ai/services/safety.service.js';
export const safetyRouter = Router();

/**
 * POST /ai/safety/check - Check content safety
 */
safetyRouter.post('/check', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { userMessage, aiResponse, model } = req.body;

    if (!userMessage) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'User message is required' } });
      return;
    }

    const result = await checkContentSafety(userMessage, aiResponse, model);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, 'Safety check failed');
    res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to check content safety' } });
  }
});

/**
 * POST /ai/safety/pii - Detect PII in text
 */
safetyRouter.post('/pii', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { text, model } = req.body;

    if (!text) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
      return;
    }

    const result = await detectPII(text, model);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, 'PII detection failed');
    res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to detect PII' } });
  }
});

/**
 * POST /ai/safety/topic - Check if content is on-topic
 */
safetyRouter.post('/topic', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { text, allowedTopics, model } = req.body;

    if (!text) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
      return;
    }

    const result = await checkTopic(text, allowedTopics, model);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, 'Topic check failed');
    res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to check topic' } });
  }
});

/**
 * POST /ai/safety/sanitize - Sanitize text
 */
safetyRouter.post('/sanitize', async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Text is required' } });
      return;
    }

    const sanitized = type === 'response' 
      ? sanitizeResponse(text)
      : sanitizeInput(text);

    res.json({
      success: true,
      data: {
        original: text,
        sanitized,
        modified: text !== sanitized
      }
    });
  } catch (error) {
    logger.error({ error }, 'Sanitization failed');
    res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to sanitize text' } });
  }
});

/**
 * POST /ai/safety/full-check - Full safety pipeline
 */
safetyRouter.post('/full-check', async (req, res) => {
  try {
    if (!isNvidiaConfigured()) {
      res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI service not available' } });
      return;
    }

    const { userInput, aiResponse } = req.body;

    if (!userInput) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'User input is required' } });
      return;
    }

    const result = await fullSafetyCheck(userInput, aiResponse);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ error }, 'Full safety check failed');
    res.status(500).json({ error: { code: 'SAFETY_ERROR', message: 'Failed to perform safety check' } });
  }
});
