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

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function getUserId(): string | undefined {
  return requestContext.getStore()?.userId;
}

export function setRequestContext(ctx: RequestContext): void {
  const store = requestContext.getStore() || {};
  requestContext.enterWith({ ...store, ...ctx });
}
