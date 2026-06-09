#!/usr/bin/env node
/**
 * Generate VAPID keys for Web Push notifications.
 * Run: node scripts/generate-vapid-keys.js
 * 
 * Output:
 *   VAPID_PUBLIC_KEY=<base64url>
 *   VAPID_PRIVATE_KEY=<base64url>
 * 
 * Add these to your .env files.
 */

const webPush = require('web-push');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your .env files:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nFor the frontend .env.local:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('\nFor the backend .env:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:admin@orin.app');
console.log('\nFor Supabase Edge Functions (secrets set via CLI):');
console.log(`supabase secrets set VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`supabase secrets set VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`supabase secrets set VAPID_SUBJECT=mailto:admin@orin.app`);
console.log('\n============================\n');
