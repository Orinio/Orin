"use strict";
/**
 * Orin AI - Vision Service
 * Uses meta/llama-3.2-*-vision-instruct for image understanding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImage = analyzeImage;
exports.extractCertificateInfo = extractCertificateInfo;
exports.verifyCertificate = verifyCertificate;
exports.analyzeScreenshot = analyzeScreenshot;
const models_js_1 = require("../core/models.js");
const logger_js_1 = require("../../logger.js");
/**
 * Analyze an image with a vision model
 */
async function analyzeImage(imageUrl, prompt = 'Describe what you see in this image in detail.', model = models_js_1.MODELS.vision.primary) {
    if (!models_js_1.NVIDIA_CONFIG.isConfigured) {
        throw new Error('NVIDIA API key not configured');
    }
    const startTime = Date.now();
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
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }],
                max_tokens: 500,
                temperature: 0.3
            }),
            signal: AbortSignal.timeout(30000)
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Vision API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const tokensUsed = data.usage?.total_tokens || 0;
        const durationMs = Date.now() - startTime;
        logger_js_1.logger.info({
            model,
            imageUrl: imageUrl.substring(0, 100),
            tokensUsed,
            durationMs
        }, 'Image analyzed');
        return {
            content,
            tokensUsed,
            durationMs
        };
    }
    catch (error) {
        logger_js_1.logger.error({ error, model, imageUrl }, 'Image analysis failed');
        throw error;
    }
}
/**
 * Extract certificate information from an image
 */
async function extractCertificateInfo(imageUrl, model = models_js_1.MODELS.vision.primary) {
    const prompt = `Extract all information from this certificate image. Return a JSON object with:
{
  "issuer": "name of organization issuing the certificate",
  "recipientName": "name of the person receiving the certificate",
  "issueDate": "date when certificate was issued",
  "certificateId": "unique identifier if present",
  "courseName": "name of course or achievement",
  "description": "brief description of what the certificate is for",
  "isValid": true,
  "rawText": "all text visible on the certificate"
}

Only return the JSON object, no other text.`;
    const result = await analyzeImage(imageUrl, prompt, model);
    // Parse the JSON response
    try {
        // Try to extract JSON from the response
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                issuer: parsed.issuer,
                recipientName: parsed.recipientName,
                issueDate: parsed.issueDate,
                certificateId: parsed.certificateId,
                courseName: parsed.courseName,
                description: parsed.description,
                isValid: parsed.isValid !== false,
                rawText: parsed.rawText || result.content
            };
        }
    }
    catch (e) {
        logger_js_1.logger.warn({ error: e }, 'Failed to parse certificate JSON');
    }
    // Fallback: return raw text
    return {
        rawText: result.content,
        isValid: true
    };
}
/**
 * Verify if a certificate image is authentic
 */
async function verifyCertificate(imageUrl, expectedIssuer, model = models_js_1.MODELS.vision.primary) {
    const certInfo = await extractCertificateInfo(imageUrl, model);
    const reasons = [];
    let confidence = 0.5; // Base confidence
    // Check if issuer matches expected
    if (expectedIssuer && certInfo.issuer) {
        const issuerMatch = certInfo.issuer.toLowerCase().includes(expectedIssuer.toLowerCase());
        if (issuerMatch) {
            confidence += 0.3;
            reasons.push(`Issuer matches expected: ${certInfo.issuer}`);
        }
        else {
            confidence -= 0.2;
            reasons.push(`Issuer mismatch: expected "${expectedIssuer}", got "${certInfo.issuer}"`);
        }
    }
    // Check if certificate has key elements
    if (certInfo.recipientName) {
        confidence += 0.1;
        reasons.push('Has recipient name');
    }
    if (certInfo.issueDate) {
        confidence += 0.1;
        reasons.push(`Issued on: ${certInfo.issueDate}`);
    }
    if (certInfo.certificateId) {
        confidence += 0.1;
        reasons.push(`Has certificate ID: ${certInfo.certificateId}`);
    }
    // Ensure confidence is between 0 and 1
    confidence = Math.max(0, Math.min(1, confidence));
    return {
        verified: confidence >= 0.6,
        confidence,
        certificateInfo: certInfo,
        reasons
    };
}
/**
 * Analyze a screenshot for proof verification
 */
async function analyzeScreenshot(imageUrl, proofType = 'other', model = models_js_1.MODELS.vision.primary) {
    let prompt;
    switch (proofType) {
        case 'github':
            prompt = `Analyze this GitHub screenshot. Extract:
- Repository name
- Stars/forks if visible
- Code snippets or commits
- Any achievements or contributions
Return a JSON with "description" and "extractedInfo" fields.`;
            break;
        case 'certificate':
            const certResult = await extractCertificateInfo(imageUrl, model);
            return {
                description: certResult.rawText || 'Certificate image analyzed',
                extractedInfo: certResult,
                isValidProof: certResult.isValid !== false
            };
        case 'project':
            prompt = `Analyze this project screenshot. Extract:
- Project name
- Technologies used
- Features visible
- Quality indicators
Return a JSON with "description" and "extractedInfo" fields.`;
            break;
        default:
            prompt = `Analyze this image. Extract all relevant information. 
Return a JSON with "description" and "extractedInfo" fields.`;
    }
    const result = await analyzeImage(imageUrl, prompt, model);
    try {
        const jsonMatch = result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                description: parsed.description || result.content,
                extractedInfo: parsed.extractedInfo || {},
                isValidProof: true
            };
        }
    }
    catch (e) {
        // Fallback
    }
    return {
        description: result.content,
        extractedInfo: {},
        isValidProof: true
    };
}
//# sourceMappingURL=vision.service.js.map