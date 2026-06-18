import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@orin.app';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

// VAPID JWT signing using Web Crypto API (ES256)
async function signVapidJwt(subscription: PushSubscription): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 12 * 60 * 12; // 12 hours

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: new URL(subscription.endpoint).origin,
    exp,
    sub: VAPID_SUBJECT,
  };

  // Base64url encode
  const b64url = (data: object) =>
    btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const headerEncoded = b64url(header);
  const payloadEncoded = b64url(payload);
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  // Import VAPID private key for ECDSA P-256
  const privateKeyBytes = new Uint8Array(
    atob(VAPID_PRIVATE_KEY.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the input
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32);

  const b64urlSig = (buf: Uint8Array) =>
    btoa(String.fromCharCode(...buf))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${signingInput}.${b64urlSig(r)}${b64urlSig(s)}`;
}

// Encrypt payload for web push (AES128-GCM + ECDH)
async function encryptPushPayload(
  subscription: PushSubscription,
  payload: string
): Promise<{ body: Uint8Array; contentEncoding: string }> {
  const userPublicKey = subscription.p256dh;
  const userAuth = subscription.auth_key;

  // Decode user's public key and auth secret
  const pubKeyBytes = new Uint8Array(
    atob(userPublicKey.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => c.charCodeAt(0))
  );
  const authBytes = new Uint8Array(
    atob(userAuth.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import user's public key
  const userPubKey = await crypto.subtle.importKey(
    'raw',
    pubKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPubKey },
    localKeyPair.privateKey,
    256
  );

  // Derive encryption key from shared secret + auth + salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const info = new TextEncoder().encode('WebPush: info\x00\x00');

  // HKDF-like key derivation
  const ikmInput = new Uint8Array([...new Uint8Array(sharedSecret), ...authBytes]);
  const prk = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', ikmInput),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const ikm = await crypto.subtle.sign('HMAC', prk, new Uint8Array(0));

  const ikmKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF', hash: 'SHA-256' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    ikmKey,
    256
  );

  const keyBytes = new Uint8Array(derivedBits).slice(0, 16);
  const nonce = new Uint8Array(derivedBits).slice(16, 28);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const plaintext = new TextEncoder().encode(payload);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    plaintext
  );

  // Build record: rs(2 bytes) + salt(16) + rs(4) + id(4) + encrypted
  const localPubRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPub = new Uint8Array(localPubRaw);

  const record = new Uint8Array(
    2 + localPub.length + 16 + 4 + 4 + encrypted.byteLength
  );
  let offset = 0;

  // Record size (2 bytes, big endian)
  record[offset++] = (encrypted.byteLength + 16 + 4 + 4) >> 8;
  record[offset++] = (encrypted.byteLength + 16 + 4 + 4) & 0xff;

  // Local public key (65 bytes)
  record.set(localPub, offset);
  offset += localPub.length;

  // Salt (16 bytes)
  record.set(salt, offset);
  offset += salt.length;

  // rs (4 bytes)
  record[offset++] = 0;
  record[offset++] = 0;
  record[offset++] = 0x10;
  record[offset++] = 0;

  // id (4 bytes)
  record[offset++] = 0;
  record[offset++] = 0;
  record[offset++] = 0;
  record[offset++] = 0x01;

  // Encrypted content
  record.set(new Uint8Array(encrypted), offset);

  return { body: record, contentEncoding: 'aes128gcm' };
}

// Send push notification with proper VAPID auth
async function sendWebPush(
  subscription: PushSubscription,
  payload: string
): Promise<boolean> {
  try {
    const vapidToken = await signVapidJwt(subscription);
    const { body, contentEncoding } = await encryptPushPayload(subscription, payload);

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': `application/octet-stream`,
        'Content-Encoding': contentEncoding,
        'TTL': '86400',
        'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
      },
      body,
    });
    return response.ok;
  } catch (err) {
    console.error('Push send failed:', err);
    return false;
  }
}

// Call NVIDIA NIM API for AI-generated notification content
async function generateAINotification(
  userProfile: any,
  proofs: any[],
  skills: string[]
): Promise<{ title: string; body: string; type: string; link: string } | null> {
  if (!NVIDIA_API_KEY) {
    // Fallback: generate a simple notification without AI
    return generateFallbackNotification(userProfile, proofs, skills);
  }

  const systemPrompt = `You are Orin's notification AI. Generate a personalized, actionable notification for a developer.
Return ONLY a JSON object with these fields:
- title: Short notification title (max 50 chars)
- body: Notification body (max 150 chars)  
- type: One of: "coach_tip", "opportunity_match", "verification_update", "weekly_summary"
- link: Dashboard link path (e.g., "/dashboard/proof/new", "/opportunities")

Be specific, actionable, and encouraging. Reference their actual skills and proofs.`;

  const userContext = `
User: ${userProfile.full_name || userProfile.username}
Skills: ${skills.slice(0, 10).join(', ') || 'None yet'}
Proofs: ${proofs.length} total, ${proofs.filter((p: any) => p.verification_status === 'verified').length} verified
Proof types: ${[...new Set(proofs.map((p: any) => p.source_type))].join(', ') || 'None'}
Headline: ${userProfile.headline || 'Not set'}
`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a notification for this user:\n${userContext}` },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('NVIDIA API error:', response.status);
      return generateFallbackNotification(userProfile, proofs, skills);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && parsed.body) {
        return {
          title: parsed.title,
          body: parsed.body,
          type: parsed.type || 'coach_tip',
          link: parsed.link || '/dashboard',
        };
      }
    }

    return generateFallbackNotification(userProfile, proofs, skills);
  } catch (err) {
    console.error('AI notification generation failed:', err);
    return generateFallbackNotification(userProfile, proofs, skills);
  }
}

function generateFallbackNotification(
  userProfile: any,
  proofs: any[],
  skills: string[]
): { title: string; body: string; type: string; link: string } {
  const verifiedCount = proofs.filter((p: any) => p.verification_status === 'verified').length;
  const tips = [
    {
      title: 'Grow your portfolio',
      body: `You have ${proofs.length} proofs with ${verifiedCount} verified. Add more to boost your score!`,
      type: 'coach_tip' as const,
      link: '/dashboard/proof/new',
    },
    {
      title: 'Skill spotlight',
      body: `Your top skills: ${skills.slice(0, 3).join(', ') || 'None yet'}. Keep building!`,
      type: 'coach_tip' as const,
      link: '/dashboard',
    },
    {
      title: 'Check new opportunities',
      body: 'We found new internships and jobs matching your skills. Take a look!',
      type: 'opportunity_match' as const,
      link: '/opportunities',
    },
    {
      title: 'Verify your proofs',
      body: `${verifiedCount}/${proofs.length} proofs verified. Verified proofs get more views!`,
      type: 'verification_update' as const,
      link: '/dashboard',
    },
  ];

  return tips[Math.floor(Math.random() * tips.length)];
}

serve(async (req) => {
  // Only allow POST from cron
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify cron secret
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get active users who logged in within last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: activeUsers, error: usersError } = await supabase
      .from('users')
      .select('id, username, full_name, headline')
      .gte('last_login_at', thirtyDaysAgo)
      .is('deleted_at', null)
      .limit(100);

    if (usersError || !activeUsers || activeUsers.length === 0) {
      return new Response(JSON.stringify({ message: 'No active users found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let notificationsCreated = 0;
    let pushSent = 0;

    for (const user of activeUsers) {
      // Check if user has notification preferences allowing coach tips
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('coach_tips, push_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs && !prefs.coach_tips) continue;
      if (prefs && !prefs.push_enabled) continue;

      // Get user's proofs and skills
      const { data: proofs } = await supabase
        .from('proof_cards')
        .select('source_type, verification_status, skills_extracted')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      const skills = [...new Set(
        (proofs || []).flatMap((p: any) => p.skills_extracted || [])
      )];

      // Generate AI notification
      const notification = await generateAINotification(user, proofs || [], skills);
      if (!notification) continue;

      // Save notification to database
      const { data: savedNotif } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          payload: { source: 'hourly-ai', generated_at: new Date().toISOString() },
        })
        .select('id')
        .single();

      if (savedNotif) {
        notificationsCreated++;

        // Send push notification (only if VAPID keys are configured)
        if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
          const { data: pushSubs } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth_key')
            .eq('user_id', user.id)
            .eq('is_active', true);

          if (pushSubs && pushSubs.length > 0) {
          const pushPayload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.link,
            type: notification.type,
            notificationId: savedNotif.id,
            tag: `orin-${notification.type}-${Date.now()}`,
          });

          for (const sub of pushSubs) {
            const ok = await sendWebPush(sub, pushPayload);
            if (ok) {
              pushSent++;
            } else {
              // Deactivate invalid subscriptions
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('endpoint', sub.endpoint);
            }
          }
        }
        } // end VAPID check
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notificationsCreated,
      pushSent,
      usersProcessed: activeUsers.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Hourly notification error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
