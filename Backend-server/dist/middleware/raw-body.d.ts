import type { Request, Response } from 'express';
/**
 * Captures raw body for webhook signature verification.
 * Must be used WITH express.json() via its `verify` callback:
 *   express.json({ verify: rawBodyVerifier })
 * This avoids the race condition of the previous monkey-patch approach.
 */
export declare function rawBodyVerifier(req: Request, _res: Response, buf: Buffer, _encoding: BufferEncoding): void;
//# sourceMappingURL=raw-body.d.ts.map