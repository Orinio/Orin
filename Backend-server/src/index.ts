/// <reference path="./types.d.ts" />
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { rawBodyVerifier } from './middleware/raw-body.js';
import { requestTiming } from './middleware/request-timing.js';
import { inputSanitizer } from './middleware/input-sanitizer.js';
import { requestDeduplication } from './middleware/request-deduplication.js';
import { requestContextMiddleware } from './middleware/request-context.js';
import { authMiddleware } from './middleware/auth.js';
import { globalAIRateLimitMiddleware } from './lib/rate-limit.js';
import { connectionTracker } from './lib/connection-tracker.js';
import { healthRouter } from './routes/health.js';
import { webhooksRouter } from './routes/webhooks.js';
import { jobsRouter } from './routes/jobs.js';
import { aiRouter } from './routes/ai.js';
import { coachRouter } from './routes/coach.js';
import { embeddingRouter } from './routes/embeddings.js';
import { visionRouter } from './routes/vision.js';
import { safetyRouter } from './routes/safety.js';
import { agentRouter } from './routes/agents.js';
import { metricsRouter } from './routes/metrics.js';
import { chatRouter } from './routes/chat.js';
import { integrationsRouter } from './routes/integrations.js';
import { billingRouter } from './routes/billing.js';
import { socialRouter } from './routes/social.js';
import { initTools } from './lib/ai/tools/index.js';
import { configureVapid } from './lib/push.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === 'development';

// Initialize AI tools once at startup
initTools();

// Initialize VAPID for push notifications
configureVapid();

// Request ID (first — propagates to all downstream middleware)
app.use(requestIdMiddleware);

// Security headers with production-grade Helmet config
app.use(helmet({
  contentSecurityPolicy: isDev ? false : {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  strictTransportSecurity: isDev ? false : {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));

// CORS — strict origin validation
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
}));

// Response compression (skip for small responses and webhooks)
app.use(compression({
  filter: (req, res) => {
    // Don't compress webhooks (raw body needed for signature verification)
    if (req.url.startsWith('/webhooks')) return false;
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses > 1KB
}));

// Global rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
}));

// Body parsing (rawBodyVerifier captures raw body for webhook signature verification)
app.use(express.json({ limit: '1mb', verify: rawBodyVerifier }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input sanitization (defense-in-depth for XSS/injection)
app.use(inputSanitizer);

// Request deduplication (prevent double-submits, 5s window)
app.use(requestDeduplication);

// Request timing + logging (skip health checks)
app.use(requestTiming);

// API versioning header
app.use((_req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0');
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/webhooks', webhooksRouter);
app.use('/jobs', authMiddleware, requestContextMiddleware, jobsRouter);
app.use('/ai', authMiddleware, requestContextMiddleware, globalAIRateLimitMiddleware, aiRouter);
app.use('/coach', authMiddleware, requestContextMiddleware, coachRouter);
app.use('/ai/embeddings', authMiddleware, requestContextMiddleware, globalAIRateLimitMiddleware, embeddingRouter);
app.use('/ai/vision', authMiddleware, requestContextMiddleware, globalAIRateLimitMiddleware, visionRouter);
app.use('/ai/safety', authMiddleware, requestContextMiddleware, globalAIRateLimitMiddleware, safetyRouter);
app.use('/ai', authMiddleware, requestContextMiddleware, globalAIRateLimitMiddleware, agentRouter);
app.use('/chat', authMiddleware, requestContextMiddleware, chatRouter);
app.use('/integrations', authMiddleware, requestContextMiddleware, integrationsRouter);
app.use('/billing', authMiddleware, requestContextMiddleware, billingRouter);
app.use('/social', authMiddleware, requestContextMiddleware, socialRouter);

// Metrics (no auth — internal use, protected by network)
app.use('/metrics', metricsRouter);

// Cache-control headers for GET endpoints
app.use((req, res, next) => {
  if (req.method === 'GET') {
    // Health checks: no cache
    if (req.url.startsWith('/health')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    // Static data (skills, opportunities): short cache
    else if (req.url.startsWith('/ai/skills') || req.url.startsWith('/ai/match')) {
      res.setHeader('Cache-Control', 'private, max-age=60');
    }
    // Metrics: short cache
    else if (req.url.startsWith('/metrics')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    // Other GETs: default
    else {
      res.setHeader('Cache-Control', 'private, max-age=10');
    }
  }
  next();
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Error handling (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  connectionTracker.track(server);
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

// Graceful shutdown
let isShuttingDown = false;

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal, activeConnections: connectionTracker.activeCount }, 'Graceful shutdown initiated');

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server stopped accepting new connections');

    // Wait for active connections to drain
    await connectionTracker.drain(8_000);

    logger.info('All connections drained — exiting');
    process.exit(0);
  });

  // Force exit after 10 seconds (Docker SIGKILL window)
  setTimeout(() => {
    logger.error({ remaining: connectionTracker.activeCount }, 'Shutdown timeout exceeded — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled errors
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  shutdown('uncaughtException');
});

export default app;
