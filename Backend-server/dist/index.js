"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./types.d.ts" />
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_js_1 = require("./lib/logger.js");
const error_handler_js_1 = require("./middleware/error-handler.js");
const request_id_js_1 = require("./middleware/request-id.js");
const raw_body_js_1 = require("./middleware/raw-body.js");
const request_timing_js_1 = require("./middleware/request-timing.js");
const input_sanitizer_js_1 = require("./middleware/input-sanitizer.js");
const request_deduplication_js_1 = require("./middleware/request-deduplication.js");
const request_context_js_1 = require("./middleware/request-context.js");
const auth_js_1 = require("./middleware/auth.js");
const rate_limit_js_1 = require("./lib/rate-limit.js");
const connection_tracker_js_1 = require("./lib/connection-tracker.js");
const health_js_1 = require("./routes/health.js");
const webhooks_js_1 = require("./routes/webhooks.js");
const jobs_js_1 = require("./routes/jobs.js");
const ai_js_1 = require("./routes/ai.js");
const coach_js_1 = require("./routes/coach.js");
const embeddings_js_1 = require("./routes/embeddings.js");
const vision_js_1 = require("./routes/vision.js");
const safety_js_1 = require("./routes/safety.js");
const agents_js_1 = require("./routes/agents.js");
const metrics_js_1 = require("./routes/metrics.js");
const chat_js_1 = require("./routes/chat.js");
const integrations_js_1 = require("./routes/integrations.js");
const billing_js_1 = require("./routes/billing.js");
const index_js_1 = require("./lib/ai/tools/index.js");
const push_js_1 = require("./lib/push.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === 'development';
// Initialize AI tools once at startup
(0, index_js_1.initTools)();
// Initialize VAPID for push notifications
(0, push_js_1.configureVapid)();
// Request ID (first — propagates to all downstream middleware)
app.use(request_id_js_1.requestIdMiddleware);
// Security headers with production-grade Helmet config
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
}));
// Response compression (skip for small responses and webhooks)
app.use((0, compression_1.default)({
    filter: (req, res) => {
        // Don't compress webhooks (raw body needed for signature verification)
        if (req.url.startsWith('/webhooks'))
            return false;
        // Don't compress if client doesn't support it
        if (req.headers['x-no-compression'])
            return false;
        return compression_1.default.filter(req, res);
    },
    threshold: 1024, // Only compress responses > 1KB
}));
// Global rate limiting
app.use((0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
}));
// Body parsing (rawBodyVerifier captures raw body for webhook signature verification)
app.use(express_1.default.json({ limit: '1mb', verify: raw_body_js_1.rawBodyVerifier }));
app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
// Input sanitization (defense-in-depth for XSS/injection)
app.use(input_sanitizer_js_1.inputSanitizer);
// Request deduplication (prevent double-submits, 5s window)
app.use(request_deduplication_js_1.requestDeduplication);
// Request timing + logging (skip health checks)
app.use(request_timing_js_1.requestTiming);
// API versioning header
app.use((_req, res, next) => {
    res.setHeader('X-API-Version', '1.0.0');
    next();
});
// Routes
app.use('/health', health_js_1.healthRouter);
app.use('/webhooks', webhooks_js_1.webhooksRouter);
app.use('/jobs', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, jobs_js_1.jobsRouter);
app.use('/ai', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, rate_limit_js_1.globalAIRateLimitMiddleware, ai_js_1.aiRouter);
app.use('/coach', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, coach_js_1.coachRouter);
app.use('/ai/embeddings', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, rate_limit_js_1.globalAIRateLimitMiddleware, embeddings_js_1.embeddingRouter);
app.use('/ai/vision', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, rate_limit_js_1.globalAIRateLimitMiddleware, vision_js_1.visionRouter);
app.use('/ai/safety', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, rate_limit_js_1.globalAIRateLimitMiddleware, safety_js_1.safetyRouter);
app.use('/ai', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, rate_limit_js_1.globalAIRateLimitMiddleware, agents_js_1.agentRouter);
app.use('/chat', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, chat_js_1.chatRouter);
app.use('/integrations', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, integrations_js_1.integrationsRouter);
app.use('/billing', auth_js_1.authMiddleware, request_context_js_1.requestContextMiddleware, billing_js_1.billingRouter);
// Metrics (no auth — internal use, protected by network)
app.use('/metrics', metrics_js_1.metricsRouter);
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
app.use(error_handler_js_1.errorHandler);
// Start server
const server = app.listen(PORT, () => {
    connection_tracker_js_1.connectionTracker.track(server);
    logger_js_1.logger.info(`Backend server running on port ${PORT}`);
    if (!process.env.NVIDIA_API_KEY) {
        logger_js_1.logger.warn('NVIDIA_API_KEY not set — AI agents will return fallback responses');
    }
    if (!process.env.GITHUB_WEBHOOK_SECRET) {
        logger_js_1.logger.warn('GITHUB_WEBHOOK_SECRET not set — webhook signature verification disabled');
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        logger_js_1.logger.warn('STRIPE_WEBHOOK_SECRET not set — Stripe webhook signature verification disabled');
    }
});
// Graceful shutdown
let isShuttingDown = false;
async function shutdown(signal) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    logger_js_1.logger.info({ signal, activeConnections: connection_tracker_js_1.connectionTracker.activeCount }, 'Graceful shutdown initiated');
    // Stop accepting new connections
    server.close(async () => {
        logger_js_1.logger.info('HTTP server stopped accepting new connections');
        // Wait for active connections to drain
        await connection_tracker_js_1.connectionTracker.drain(8_000);
        logger_js_1.logger.info('All connections drained — exiting');
        process.exit(0);
    });
    // Force exit after 10 seconds (Docker SIGKILL window)
    setTimeout(() => {
        logger_js_1.logger.error({ remaining: connection_tracker_js_1.connectionTracker.activeCount }, 'Shutdown timeout exceeded — forcing exit');
        process.exit(1);
    }, 10_000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// Catch unhandled errors
process.on('unhandledRejection', (reason) => {
    logger_js_1.logger.error({ reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
    logger_js_1.logger.fatal({ err }, 'Uncaught exception — shutting down');
    shutdown('uncaughtException');
});
exports.default = app;
//# sourceMappingURL=index.js.map