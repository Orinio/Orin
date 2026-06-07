"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputSanitizer = inputSanitizer;
/**
 * Input sanitization middleware.
 * Strips dangerous characters from request body string values to prevent
 * basic XSS/injection attacks. This is a defense-in-depth layer —
 * Zod validation handles the primary input validation.
 */
const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // script tags
    /javascript:/gi, // javascript: URIs
    /on\w+\s*=/gi, // inline event handlers (onclick, onerror, etc.)
    /data:text\/html/gi, // data URI HTML
    /vbscript:/gi, // vbscript
];
function sanitizeString(value) {
    let sanitized = value;
    for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, '');
    }
    return sanitized;
}
function sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        }
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeString(item) :
                typeof item === 'object' && item !== null ? sanitizeObject(item) :
                    item);
        }
        else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
function inputSanitizer(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}
//# sourceMappingURL=input-sanitizer.js.map