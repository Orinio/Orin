"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContext = void 0;
exports.getRequestId = getRequestId;
exports.getUserId = getUserId;
exports.setRequestContext = setRequestContext;
const async_hooks_1 = require("async_hooks");
exports.requestContext = new async_hooks_1.AsyncLocalStorage();
function getRequestId() {
    return exports.requestContext.getStore()?.requestId;
}
function getUserId() {
    return exports.requestContext.getStore()?.userId;
}
function setRequestContext(ctx) {
    const store = exports.requestContext.getStore() || {};
    exports.requestContext.enterWith({ ...store, ...ctx });
}
//# sourceMappingURL=request-context.js.map