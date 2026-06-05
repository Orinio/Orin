import type { Request, Response, NextFunction } from 'express';

export function rawBodyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.path.startsWith('/webhooks')) {
    const chunks: Buffer[] = [];
    const originalOn = req.on.bind(req);

    req.on = function (event: string, listener: (...args: any[]) => void) {
      if (event === 'data') {
        const wrappedListener = (chunk: Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          listener(chunk);
        };
        return originalOn(event, wrappedListener);
      }
      return originalOn(event, listener);
    } as typeof req.on;

    req.on('end', () => {
      (req as any).rawBody = Buffer.concat(chunks).toString('utf8');
    });
  }
  next();
}
