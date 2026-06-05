import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

export const webhooksRouter = Router();

function verifyGitHubSignature(rawBody: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function verifyStripeSignature(rawBody: string, sigHeader: string | undefined, secret: string): boolean {
  if (!sigHeader) return false;

  const parts = Object.fromEntries(
    sigHeader.split(',').map(pair => {
      const [key, value] = pair.split('=');
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) return false;

  // Reject if timestamp is older than 5 minutes (replay protection)
  const tolerance = 300;
  const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (timestampAge > tolerance) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(signedPayload).digest('hex');

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

webhooksRouter.post('/github', async (req, res) => {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret) {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const signature = req.headers['x-hub-signature-256'] as string;
      if (!verifyGitHubSignature(rawBody, signature, secret)) {
        logger.warn({ requestId: req.id }, 'GitHub webhook signature verification failed');
        res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
        return;
      }
    }

    const payload = req.body;
    const event = req.headers['x-github-event'];

    logger.info({ event, action: payload.action, requestId: req.id }, 'GitHub webhook received');

    if (event === 'push' && payload.repository) {
      const { repository, sender } = payload;

      const { data: proofs } = await supabase
        .from('proof_cards')
        .select('*')
        .eq('source_url', repository.html_url)
        .eq('verification_status', 'pending');

      if (proofs && proofs.length > 0) {
        logger.info({ proofs: proofs.length, repo: repository.full_name }, 'Auto-verifying proofs');

        for (const proof of proofs) {
          await supabase
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
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Webhook processing error');
    res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } });
  }
});

webhooksRouter.post('/stripe', async (req, res) => {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret) {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const sigHeader = req.headers['stripe-signature'] as string;
      if (!verifyStripeSignature(rawBody, sigHeader, secret)) {
        logger.warn({ requestId: req.id }, 'Stripe webhook signature verification failed');
        res.status(401).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
        return;
      }
    }

    const event = req.body;
    logger.info({ type: event?.type, requestId: req.id }, 'Stripe webhook received');

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        if (session?.client_reference_id) {
          const { error } = await supabase
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
            logger.error({ error }, 'Failed to update user subscription');
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data?.object;
        if (subscription?.id) {
          const status = subscription.status === 'active' ? 'active' : 'inactive';
          await supabase
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
          await supabase
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
          await supabase
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
        logger.debug({ type: event.type }, 'Unhandled Stripe event');
    }

    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Stripe webhook processing error');
    res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } });
  }
});
