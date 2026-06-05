import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);

    res.json({
      status: error ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: error ? 'error' : 'connected',
      },
    });
  } catch {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unreachable',
      },
    });
  }
});
