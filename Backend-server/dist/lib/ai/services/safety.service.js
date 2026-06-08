"use strict";
/**
 * Orin AI - Safety Service
 * Uses NVIDIA NeMo Guard models for content moderation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeResponse = void 0;
exports.checkContentSafety = checkContentSafety;
exports.detectPII = detectPII;
exports.checkTopic = checkTopic;
exports.sanitizeInput = sanitizeInput;
exports.fullSafetyCheck = fullSafetyCheck;
const models_js_1 = require("../core/models.js");
const logger_js_1 = require("../../logger.js");
const utils_js_1 = require("../core/utils.js");
// Re-export for backward compatibility
exports.sanitizeResponse = utils_js_1.sanitizeAnswer;
/**
 * Check content safety using NeMo Guard
 */
async function checkContentSafety(userMessage, aiResponse, model = models_js_1.MODELS.safety.content) {
    if (!models_js_1.NVIDIA_CONFIG.isConfigured) {
        return {
            isSafe: true,
            userSafety: 'safe',
            responseSafety: 'safe',
            categories: [],
            confidence: 0
        };
    }
    const startTime = Date.now();
    try {
        const contentToCheck = aiResponse
            ? `User: ${userMessage}\nResponse: ${aiResponse}`
            : userMessage;
        const response = await fetch(`${models_js_1.NVIDIA_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${models_js_1.NVIDIA_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [{
                        role: 'user',
                        content: `Check if this content is safe. Return JSON: {"User Safety": "safe" or "unsafe", "Response Safety": "safe" or "unsafe"}\n\nContent: ${contentToCheck}`
                    }],
                max_tokens: 100,
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
            logger_js_1.logger.warn({ status: response.status }, 'Safety check failed');
            return {
                isSafe: true,
                userSafety: 'safe',
                responseSafety: 'safe',
                categories: [],
                confidence: 0
            };
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        // Parse safety result
        let userSafety = 'safe';
        let responseSafety = 'safe';
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                userSafety = parsed['User Safety'] || 'safe';
                responseSafety = parsed['Response Safety'] || 'safe';
            }
        }
        catch (e) {
            // Default to safe if parsing fails
        }
        const isSafe = userSafety === 'safe' && responseSafety === 'safe';
        logger_js_1.logger.info({
            model,
            isSafe,
            userSafety,
            responseSafety,
            durationMs: Date.now() - startTime
        }, 'Content safety checked');
        return {
            isSafe,
            userSafety,
            responseSafety,
            categories: isSafe ? [] : ['potentially_unsafe'],
            confidence: isSafe ? 0.9 : 0.7
        };
    }
    catch (error) {
        logger_js_1.logger.error({ error, model }, 'Safety check error');
        // Fail open - allow content if safety check fails
        return {
            isSafe: true,
            userSafety: 'safe',
            responseSafety: 'safe',
            categories: [],
            confidence: 0
        };
    }
}
/**
 * Detect PII in text
 */
async function detectPII(text, model = models_js_1.MODELS.safety.pii) {
    if (!models_js_1.NVIDIA_CONFIG.isConfigured) {
        return {
            hasPII: false,
            entities: [],
            taggedText: text
        };
    }
    try {
        const response = await fetch(`${models_js_1.NVIDIA_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${models_js_1.NVIDIA_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [{
                        role: 'user',
                        content: text
                    }],
                max_tokens: 500,
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
            return {
                hasPII: false,
                entities: [],
                taggedText: text
            };
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        // Parse PII result
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    hasPII: (parsed.total_entities || 0) > 0,
                    entities: parsed.entities || [],
                    taggedText: parsed.tagged_text || text
                };
            }
        }
        catch (e) {
            // Fallback
        }
        return {
            hasPII: false,
            entities: [],
            taggedText: text
        };
    }
    catch (error) {
        logger_js_1.logger.error({ error, model }, 'PII detection error');
        return {
            hasPII: false,
            entities: [],
            taggedText: text
        };
    }
}
/**
 * Check if content is on-topic
 */
async function checkTopic(text, _allowedTopics = ['career', 'jobs', 'skills', 'learning', 'portfolio', 'coding', 'development'], model = models_js_1.MODELS.safety.topic) {
    if (!models_js_1.NVIDIA_CONFIG.isConfigured) {
        return {
            isOnTopic: true,
            topic: 'general',
            confidence: 0.5
        };
    }
    try {
        const response = await fetch(`${models_js_1.NVIDIA_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${models_js_1.NVIDIA_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [{
                        role: 'user',
                        content: text
                    }],
                max_tokens: 50,
                temperature: 0.1
            }),
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) {
            return {
                isOnTopic: true,
                topic: 'general',
                confidence: 0.5
            };
        }
        const data = await response.json();
        const content = (data.choices?.[0]?.message?.content || '').toLowerCase().trim();
        const isOnTopic = content !== 'off-topic';
        return {
            isOnTopic,
            topic: isOnTopic ? 'career' : 'off-topic',
            confidence: isOnTopic ? 0.8 : 0.9
        };
    }
    catch (error) {
        logger_js_1.logger.error({ error, model }, 'Topic check error');
        return {
            isOnTopic: true,
            topic: 'general',
            confidence: 0.5
        };
    }
}
/**
 * Sanitize user input before processing
 */
function sanitizeInput(input) {
    // Remove potentially dangerous characters
    let sanitized = input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    // Truncate if too long
    const MAX_LENGTH = 5000;
    if (sanitized.length > MAX_LENGTH) {
        sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
    }
    return sanitized;
}
/**
 * Full safety pipeline - check input and output
 */
async function fullSafetyCheck(userInput, aiResponse) {
    // Sanitize input
    const sanitizedInput = sanitizeInput(userInput);
    // Check input safety
    const inputSafety = await checkContentSafety(sanitizedInput);
    // Detect PII in input
    const pii = await detectPII(sanitizedInput);
    // Check output safety if provided
    let outputSafety;
    let sanitizedOutput;
    if (aiResponse) {
        sanitizedOutput = (0, exports.sanitizeResponse)(aiResponse);
        outputSafety = await checkContentSafety(sanitizedInput, sanitizedOutput);
    }
    return {
        inputSafe: inputSafety.isSafe,
        outputSafe: outputSafety?.isSafe ?? true,
        piiDetected: pii.hasPII,
        sanitizedInput,
        sanitizedOutput,
        details: {
            inputSafety,
            outputSafety,
            pii
        }
    };
}
//# sourceMappingURL=safety.service.js.map