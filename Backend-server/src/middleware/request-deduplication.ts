import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Request deduplication middleware.
 * Prevents processing of duplicate requests within a short time window.
 * Useful for webhook retries and browser double-submits.
 *
 * Uses a fingerprint of method + URL + body hash.
 * Only applies to POST/PUT/PATCH (idempotent-safe).
 */

const recentRequests = new Map<string, number>();
const DEDUP_WINDOW_MS = 5_000; // 5 second window

function hashBody(body: unknown): string {
  if (!body) return 'empty';
  try {
    const str = JSON.stringify(body);
    // Simple FNV-1a hash for speed (not cryptographic)
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(36);
  } catch {
    return 'unparseable';
  }
}

export function requestDeduplication(req: Request, res: Response, next: NextFunction): void {
  // Only dedup mutating methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  // Skip webhooks — they have their own idempotency handling
  if (req.url.startsWith('/webhooks')) {
    return next();
  }

  const fingerprint = `${req.method}:${req.url}:${hashBody(req.body)}`;
  const now = Date.now();
  const lastSeen = recentRequests.get(fingerprint);

  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    logger.warn({ fingerprint, lastSeen: now - lastSeen, requestId: req.id }, 'Duplicate request rejected');
    res.status(409).json({
      error: { code: 'DUPLICATE_REQUEST', message: 'Duplicate request detected. Please wait before retrying.' },
    });
    return;
  }

  recentRequests.set(fingerprint, now);

  // Cleanup old entries periodically
  if (recentRequests.size > 500) {
    const cutoff = now - DEDUP_WINDOW_MS;
    for (const [key, ts] of recentRequests) {
      if (ts < cutoff) recentRequests.delete(key);
    }
  }

  next();
}

/** Clear deduplication state (for testing only) */
export function _clearDeduplicationCache(): void {
  recentRequests.clear();
}
