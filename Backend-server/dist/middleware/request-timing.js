"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTiming = requestTiming;
const logger_js_1 = require("../lib/logger.js");
/**
 * Request timing middleware — logs method, URL, status, and duration.
 * Skips health checks to avoid noise. Uses info level for errors, debug for success.
 */
function requestTiming(req, res, next) {
    // Skip health checks
    if (req.url === '/health' || req.url === '/health/') {
        return next();
    }
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const durationNs = Number(process.hrtime.bigint() - start);
        const durationMs = (durationNs / 1_000_000).toFixed(1);
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            durationMs: parseFloat(durationMs),
            requestId: req.id,
            userId: req.user?.id,
        };
        if (res.statusCode >= 500) {
            logger_js_1.logger.error(logData, 'Request completed');
        }
        else if (res.statusCode >= 400) {
            logger_js_1.logger.warn(logData, 'Request completed');
        }
        else {
            logger_js_1.logger.debug(logData, 'Request completed');
        }
    });
    next();
}
//# sourceMappingURL=request-timing.js.map