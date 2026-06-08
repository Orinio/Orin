"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUrlSafe = isUrlSafe;
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', 'metadata.google.internal', '100.100.100.200'];
const BLOCKED_IP_RANGES = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^127\./, /^0\./];
function isUrlSafe(url) {
    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol))
            return { safe: false, reason: 'Only HTTP/HTTPS allowed' };
        const hostname = urlObj.hostname.toLowerCase();
        if (BLOCKED_HOSTS.includes(hostname))
            return { safe: false, reason: 'Internal URLs blocked' };
        for (const pattern of BLOCKED_IP_RANGES) {
            if (pattern.test(hostname))
                return { safe: false, reason: 'Internal IP blocked' };
        }
        if (hostname.endsWith('.internal') || hostname.endsWith('.local'))
            return { safe: false, reason: 'Internal hostnames blocked' };
        return { safe: true };
    }
    catch {
        return { safe: false, reason: 'Invalid URL format' };
    }
}
//# sourceMappingURL=search.tools.js.map