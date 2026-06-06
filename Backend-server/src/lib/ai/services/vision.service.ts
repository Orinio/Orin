/**
 * Orin AI - Vision Service
 * Uses meta/llama-3.2-*-vision-instruct for image understanding
 */

import { NVIDIA_CONFIG, MODELS } from '../core/models.js';
import { logger } from '../../logger.js';

export interface VisionResult {
  content: string;
  tokensUsed: number;
  durationMs: number;
}

export interface CertificateInfo {
  issuer?: string;
  recipientName?: string;
  issueDate?: string;
  certificateId?: string;
  courseName?: string;
  description?: string;
  isValid?: boolean;
  rawText?: string;
}

/**
 * Analyze an image with a vision model
 */
export async function analyzeImage(
  imageUrl: string,
  prompt: string = 'Describe what you see in this image in detail.',
  model: string = MODELS.vision.primary
): Promise<VisionResult> {
  if (!NVIDIA_CONFIG.isConfigured) {
    throw new Error('NVIDIA API key not configured');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${NVIDIA_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_CONFIG.apiKey}`,
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

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;
    const durationMs = Date.now() - startTime;

    logger.info({
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
  } catch (error) {
    logger.error({ error, model, imageUrl }, 'Image analysis failed');
    throw error;
  }
}

/**
 * Extract certificate information from an image
 */
export async function extractCertificateInfo(
  imageUrl: string,
  model: string = MODELS.vision.primary
): Promise<CertificateInfo> {
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
  } catch (e) {
    logger.warn({ error: e }, 'Failed to parse certificate JSON');
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
export async function verifyCertificate(
  imageUrl: string,
  expectedIssuer?: string,
  model: string = MODELS.vision.primary
): Promise<{
  verified: boolean;
  confidence: number;
  certificateInfo: CertificateInfo;
  reasons: string[];
}> {
  const certInfo = await extractCertificateInfo(imageUrl, model);
  
  const reasons: string[] = [];
  let confidence = 0.5; // Base confidence

  // Check if issuer matches expected
  if (expectedIssuer && certInfo.issuer) {
    const issuerMatch = certInfo.issuer.toLowerCase().includes(expectedIssuer.toLowerCase());
    if (issuerMatch) {
      confidence += 0.3;
      reasons.push(`Issuer matches expected: ${certInfo.issuer}`);
    } else {
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
export async function analyzeScreenshot(
  imageUrl: string,
  proofType: 'github' | 'certificate' | 'project' | 'other' = 'other',
  model: string = MODELS.vision.primary
): Promise<{
  description: string;
  extractedInfo: Record<string, any>;
  isValidProof: boolean;
}> {
  let prompt: string;

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
  } catch (e) {
    // Fallback
  }

  return {
    description: result.content,
    extractedInfo: {},
    isValidProof: true
  };
}
