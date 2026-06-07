/**
 * Orin AI - Vision Service
 * Uses meta/llama-3.2-*-vision-instruct for image understanding
 */
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
export declare function analyzeImage(imageUrl: string, prompt?: string, model?: string): Promise<VisionResult>;
/**
 * Extract certificate information from an image
 */
export declare function extractCertificateInfo(imageUrl: string, model?: string): Promise<CertificateInfo>;
/**
 * Verify if a certificate image is authentic
 */
export declare function verifyCertificate(imageUrl: string, expectedIssuer?: string, model?: string): Promise<{
    verified: boolean;
    confidence: number;
    certificateInfo: CertificateInfo;
    reasons: string[];
}>;
/**
 * Analyze a screenshot for proof verification
 */
export declare function analyzeScreenshot(imageUrl: string, proofType?: 'github' | 'certificate' | 'project' | 'other', model?: string): Promise<{
    description: string;
    extractedInfo: Record<string, any>;
    isValidProof: boolean;
}>;
//# sourceMappingURL=vision.service.d.ts.map