import webPush from 'web-push';
import { supabase } from './supabase.js';
import { logger } from './logger.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@orin.app';

let vapidConfigured = false;

export function configureVapid(): boolean {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn('VAPID keys not configured — push notifications disabled');
    return false;
  }

  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  logger.info('VAPID configured for push notifications');
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  type?: string;
  notificationId?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!vapidConfigured) {
    logger.warn('Push not configured, skipping send');
    return { sent: 0, failed: 0 };
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const pushPayload = JSON.stringify({
    ...payload,
    icon: payload.icon || '/fevicon.ico',
    badge: payload.badge || '/fevicon.ico',
    tag: payload.tag || 'orin-notification',
  });

  for (const sub of subscriptions) {
    try {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth_key,
        },
      };

      await webPush.sendNotification(subscription, pushPayload);
      sent++;
    } catch (err: any) {
      failed++;
      // If subscription is invalid, deactivate it
      if (err.statusCode === 404 || err.statusCode === 410) {
        logger.warn({ endpoint: sub.endpoint }, 'Deactivating expired push subscription');
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', sub.endpoint);
      } else {
        logger.error({ err, endpoint: sub.endpoint }, 'Push notification failed');
      }
    }
  }

  return { sent, failed };
}

export async function sendPushToAllActiveUsers(
  payload: PushPayload,
  options?: { batchSize?: number; delayMs?: number }
): Promise<{ totalSent: number; totalFailed: number; usersNotified: number }> {
  if (!vapidConfigured) {
    return { totalSent: 0, totalFailed: 0, usersNotified: 0 };
  }

  const batchSize = options?.batchSize || 50;
  const delayMs = options?.delayMs || 100;

  let totalSent = 0;
  let totalFailed = 0;
  let usersNotified = 0;
  let offset = 0;

  while (true) {
    // Get active subscriptions in batches
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .eq('is_active', true)
      .range(offset, offset + batchSize - 1);

    if (error || !subs || subs.length === 0) break;

    // Deduplicate user IDs (user may have multiple subscriptions)
    const uniqueUserIds = [...new Set(subs.map(s => s.user_id))];

    for (const userId of uniqueUserIds) {
      const result = await sendPushToUser(userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
      if (result.sent > 0) usersNotified++;
    }

    offset += batchSize;

    // Delay between batches to avoid overwhelming
    if (subs.length === batchSize) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } else {
      break;
    }
  }

  logger.info({ totalSent, totalFailed, usersNotified }, 'Bulk push notification complete');
  return { totalSent, totalFailed, usersNotified };
}
