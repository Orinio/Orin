import { AsyncLocalStorage } from 'async_hooks';
/**
 * Request context using AsyncLocalStorage.
 * Allows accessing request-scoped data (requestId, userId) from anywhere
 * in the call stack without explicit parameter passing.
 */
interface RequestContext {
    requestId?: string;
    userId?: string;
}
export declare const requestContext: AsyncLocalStorage<RequestContext>;
export declare function getRequestId(): string | undefined;
export declare function getUserId(): string | undefined;
export declare function setRequestContext(ctx: RequestContext): void;
export {};
//# sourceMappingURL=request-context.d.ts.map