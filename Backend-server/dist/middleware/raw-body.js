"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawBodyVerifier = rawBodyVerifier;
/**
 * Captures raw body for webhook signature verification.
 * Must be used WITH express.json() via its `verify` callback:
 *   express.json({ verify: rawBodyVerifier })
 * This avoids the race condition of the previous monkey-patch approach.
 */
function rawBodyVerifier(req, _res, buf, _encoding) {
    if (req.path.startsWith('/webhooks')) {
        req.rawBody = buf.toString('utf8');
    }
}
//# sourceMappingURL=raw-body.js.map