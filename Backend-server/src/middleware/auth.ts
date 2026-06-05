import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'MISSING_AUTH', message: 'Missing or invalid authorization header' } });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
      return;
    }

    (req as any).user = user;
    next();
  } catch (err) {
    logger.error({ err }, 'Auth middleware error');
    res.status(500).json({ error: { code: 'AUTH_FAILED', message: 'Authentication failed' } });
  }
}
