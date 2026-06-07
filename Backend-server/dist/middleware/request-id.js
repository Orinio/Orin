"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = require("crypto");
function requestIdMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
}
//# sourceMappingURL=request-id.js.map