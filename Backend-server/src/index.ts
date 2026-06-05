/// <reference path="./types.d.ts" />
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { rawBodyMiddleware } from './middleware/raw-body.js';
import { authMiddleware } from './middleware/auth.js';
import { healthRouter } from './routes/health.js';
import { webhooksRouter } from './routes/webhooks.js';
import { jobsRouter } from './routes/jobs.js';
import { aiRouter } from './routes/ai.js';
import { coachRouter } from './routes/coach.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Request ID (first)
app.use(requestIdMiddleware);

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
}));

// Raw body capture for webhook signature verification (before JSON parsing)
app.use(rawBodyMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (skip health checks, use debug level)
app.use((req, _res, next) => {
  if (req.url === '/health' || req.url === '/health/') {
    return next();
  }
  logger.debug({ method: req.method, url: req.url, requestId: req.id }, 'Incoming request');
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/webhooks', webhooksRouter);
app.use('/jobs', authMiddleware, jobsRouter);
app.use('/ai', authMiddleware, aiRouter);
app.use('/coach', authMiddleware, coachRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);

  if (!process.env.NVIDIA_API_KEY) {
    logger.warn('NVIDIA_API_KEY not set — AI agents will return fallback responses');
  }
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    logger.warn('GITHUB_WEBHOOK_SECRET not set — webhook signature verification disabled');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.warn('STRIPE_WEBHOOK_SECRET not set — Stripe webhook signature verification disabled');
  }
});

export default app;
