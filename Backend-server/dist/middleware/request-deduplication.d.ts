import type { Request, Response, NextFunction } from 'express';
export declare function requestDeduplication(req: Request, res: Response, next: NextFunction): void;
/** Clear deduplication state (for testing only) */
export declare function _clearDeduplicationCache(): void;
//# sourceMappingURL=request-deduplication.d.ts.map