/**
 * Orin AI - Safety Service
 * Uses NVIDIA NeMo Guard models for content moderation
 */
import { sanitizeAnswer } from '../core/utils.js';
export declare const sanitizeResponse: typeof sanitizeAnswer;
export interface SafetyCheckResult {
    isSafe: boolean;
    userSafety: 'safe' | 'unsafe';
    responseSafety: 'safe' | 'unsafe';
    categories: string[];
    confidence: number;
}
export interface PIIDetectionResult {
    hasPII: boolean;
    entities: Array<{
        text: string;
        label: string;
        start: number;
        end: number;
        score: number;
    }>;
    taggedText: string;
}
export interface TopicCheckResult {
    isOnTopic: boolean;
    topic: string;
    confidence: number;
}
/**
 * Check content safety using NeMo Guard
 */
export declare function checkContentSafety(userMessage: string, aiResponse?: string, model?: string): Promise<SafetyCheckResult>;
/**
 * Detect PII in text
 */
export declare function detectPII(text: string, model?: string): Promise<PIIDetectionResult>;
/**
 * Check if content is on-topic
 */
export declare function checkTopic(text: string, _allowedTopics?: string[], model?: string): Promise<TopicCheckResult>;
/**
 * Sanitize user input before processing
 */
export declare function sanitizeInput(input: string): string;
/**
 * Full safety pipeline - check input and output
 */
export declare function fullSafetyCheck(userInput: string, aiResponse?: string): Promise<{
    inputSafe: boolean;
    outputSafe: boolean;
    piiDetected: boolean;
    sanitizedInput: string;
    sanitizedOutput?: string;
    details: {
        inputSafety: SafetyCheckResult;
        outputSafety?: SafetyCheckResult;
        pii?: PIIDetectionResult;
    };
}>;
//# sourceMappingURL=safety.service.d.ts.map