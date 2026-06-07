"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContextMiddleware = requestContextMiddleware;
const request_context_js_1 = require("../lib/request-context.js");
/**
 * Middleware that sets up AsyncLocalStorage request context.
 * Must run after requestIdMiddleware and authMiddleware.
 */
function requestContextMiddleware(req, _res, next) {
    const ctx = {
        requestId: req.id,
        userId: req.user?.id,
    };
    request_context_js_1.requestContext.run(ctx, () => {
        next();
    });
}
//# sourceMappingURL=request-context.js.map