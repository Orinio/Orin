"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = require("express");
const crypto_1 = require("crypto");
const supabase_js_1 = require("../lib/supabase.js");
const logger_js_1 = require("../lib/logger.js");
exports.webhooksRouter = (0, express_1.Router)();
// Idempotency: track processed Stripe event IDs to prevent duplicate processing
const processedStripeEvents = new Map();
const STRIPE_EVENT_TTL_MS = 3600_000; // 1 hour
function isStripeEventProcessed(eventId) {
    const timestamp = processedStripeEvents.get(eventId);
    if (!timestamp)
        return false;
    if (Date.now() - timestamp > STRIPE_EVENT_TTL_MS) {
        processedStripeEvents.delete(eventId);
        return false;
    }
    return true;
}
function markStripeEventProcessed(eventId) {
    processedStripeEvents.set(eventId, Date.now());
    // Cleanup old entries periodically
    if (processedStripeEvents.size > 1000) {
        const cutoff = Date.now() - STRIPE_EVENT_TTL_MS;
        for (const [id, ts] of processedStripeEvents) {
            if (ts < cutoff)
                processedStripeEvents.delete(id);
        }
    }
}
async function logWebhookEvent(source, event, status, details) {
    try {
        await supabase_js_1.supabase.from('audit_log').insert({
            action: `webhook.${source}.${event}`,
            resource_type: 'webhook',
            metadata: {
                source,
                event,
                status,
                ...details,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (err) {
        // Audit logging is best-effort — don't fail the webhook
        logger_js_1.logger.error({ err, source, event }, 'Failed to log webhook event to audit_log');
    }
}
function verifyGitHubSignature(rawBody, signature, secret) {
    if (!signature)
        return false;
    const expected = 'sha256=' + (0, crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex');
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(expected), Buffer.from(signature));
    }
    catch {
        return false;
    }
}
function verifyStripeSignature(rawBody, sigHeader, secret) {
    if (!sigHeader)
        return false;
    const parts = Object.fromEntries(sigHeader.split(',').map(pair => {
        const [key, value] = pair.split('=');
        return [key, value];
    }));
    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature)
        return false;
    // Reject if timestamp is older than 5 minutes (replay protection)
    const tolerance = 300;
    const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (timestampAge > tolerance)
        return false;
    const signedPayload = `${timestamp}.${rawBody}`;
    const expected = (0, crypto_1.createHmac)('sha256', secret).update(signedPayload).digest('hex');
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(expected), Buffer.from(signature));
    }
    catch {
        return false;
    }
}
exports.webhooksRouter.post('/github', async (req, res) => {
    try {
        const secret = process.env.GITHUB_WEBHOOK_SECRET;
        if (secret) {
            const rawBody = req.rawBody || JSON.stringify(req.body);
            const signature = req.headers['x-hub-signature-256'];
            if (!verifyGitHubSignature(rawBody, signature, secret)) {
                logger_js_1.logger.warn({ requestId: req.id }, 'GitHub webhook signature verification failed');
                await logWebhookEvent('github', 'unknown', 'error', { reason: 'invalid_signature' });
                res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
                return;
            }
        }
        const payload = req.body;
        const event = req.headers['x-github-event'];
        logger_js_1.logger.info({ event, action: payload.action, requestId: req.id }, 'GitHub webhook received');
        if (event === 'push' && payload.repository) {
            const { repository, sender } = payload;
            const { data: proofs } = await supabase_js_1.supabase
                .from('proof_cards')
                .select('*')
                .eq('source_url', repository.html_url)
                .eq('verification_status', 'pending');
            if (proofs && proofs.length > 0) {
                logger_js_1.logger.info({ proofs: proofs.length, repo: repository.full_name }, 'Auto-verifying proofs');
                for (const proof of proofs) {
                    await supabase_js_1.supabase
                        .from('proof_cards')
                        .update({
                        verification_status: 'verified',
                        verified_at: new Date().toISOString(),
                        metadata: {
                            ...proof.metadata,
                            github_webhook: true,
                            verified_by: sender?.login,
                        },
                    })
                        .eq('id', proof.id);
                }
                await logWebhookEvent('github', 'push', 'success', {
                    repo: repository.full_name,
                    proofsVerified: proofs.length,
                });
            }
            else {
                await logWebhookEvent('github', 'push', 'skipped', {
                    repo: repository.full_name,
                    reason: 'no_pending_proofs',
                });
            }
        }
        res.json({ received: true });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Webhook processing error');
        await logWebhookEvent('github', 'unknown', 'error', { error: err.message });
        res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } });
    }
});
exports.webhooksRouter.post('/stripe', async (req, res) => {
    try {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (secret) {
            const rawBody = req.rawBody || JSON.stringify(req.body);
            const sigHeader = req.headers['stripe-signature'];
            if (!verifyStripeSignature(rawBody, sigHeader, secret)) {
                logger_js_1.logger.warn({ requestId: req.id }, 'Stripe webhook signature verification failed');
                await logWebhookEvent('stripe', 'unknown', 'error', { reason: 'invalid_signature' });
                res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
                return;
            }
        }
        const event = req.body;
        logger_js_1.logger.info({ type: event?.type, id: event?.id, requestId: req.id }, 'Stripe webhook received');
        // Idempotency: skip already-processed events
        if (event?.id && isStripeEventProcessed(event.id)) {
            logger_js_1.logger.info({ eventId: event.id }, 'Stripe event already processed, skipping');
            await logWebhookEvent('stripe', event?.type || 'unknown', 'skipped', { reason: 'duplicate', eventId: event.id });
            res.json({ received: true, status: 'duplicate' });
            return;
        }
        let webhookResult = 'success';
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data?.object;
                if (session?.client_reference_id) {
                    const { error } = await supabase_js_1.supabase
                        .from('users')
                        .update({
                        subscription_status: 'active',
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: session.subscription,
                        plan: session.metadata?.plan || 'pro',
                        updated_at: new Date().toISOString(),
                    })
                        .eq('auth_user_id', session.client_reference_id);
                    if (error) {
                        logger_js_1.logger.error({ error }, 'Failed to update user subscription');
                        webhookResult = 'error';
                    }
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data?.object;
                if (subscription?.id) {
                    const status = subscription.status === 'active' ? 'active' : 'inactive';
                    await supabase_js_1.supabase
                        .from('users')
                        .update({
                        subscription_status: status,
                        updated_at: new Date().toISOString(),
                    })
                        .eq('stripe_subscription_id', subscription.id);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data?.object;
                if (subscription?.id) {
                    await supabase_js_1.supabase
                        .from('users')
                        .update({
                        subscription_status: 'inactive',
                        plan: 'free',
                        updated_at: new Date().toISOString(),
                    })
                        .eq('stripe_subscription_id', subscription.id);
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data?.object;
                if (invoice?.customer) {
                    await supabase_js_1.supabase
                        .from('users')
                        .update({
                        subscription_status: 'past_due',
                        updated_at: new Date().toISOString(),
                    })
                        .eq('stripe_customer_id', invoice.customer);
                }
                break;
            }
            default:
                logger_js_1.logger.debug({ type: event.type }, 'Unhandled Stripe event');
        }
        // Mark event as processed after successful handling
        if (event?.id) {
            markStripeEventProcessed(event.id);
        }
        await logWebhookEvent('stripe', event?.type || 'unknown', webhookResult, {
            eventId: event?.id,
        });
        res.json({ received: true });
    }
    catch (err) {
        logger_js_1.logger.error({ err }, 'Stripe webhook processing error');
        await logWebhookEvent('stripe', 'unknown', 'error', { error: err.message });
        res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } });
    }
});
//# sourceMappingURL=webhooks.js.map