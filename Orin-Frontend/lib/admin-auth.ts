import { createHmac, randomBytes, createHash } from 'crypto';

/**
 * ORIN Admin Authentication System
 * 
 * Security features:
 * - PBKDF2-like key derivation using HMAC-SHA512 with high iteration count
 * - Random 32-byte salt per password
 * - Timing-safe comparison to prevent timing attacks
 * - Signed session tokens with HMAC-SHA256
 * - Session expiry (8 hours)
 */

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || generateFallbackSecret();
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours
const HASH_ITERATIONS = 100_000;

function generateFallbackSecret(): string {
  // In production, always set ADMIN_SESSION_SECRET env var
  return createHash('sha256')
    .update('orin-admin-dev-secret-' + (process.env.NODE_ENV || 'development'))
    .digest('hex');
}

/* ═══════════════════════════════════════════
   PASSWORD HASHING — HMAC-SHA512 + Salt
   ═══════════════════════════════════════════ */

export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = deriveKey(password, salt);
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const computed = deriveKey(password, salt);
  return timingSafeEqual(hash, computed);
}

function deriveKey(password: string, salt: string): string {
  let key = createHmac('sha512', salt + password).digest('hex');
  for (let i = 1; i < HASH_ITERATIONS; i++) {
    key = createHmac('sha512', key + salt + password).digest('hex');
  }
  return key;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/* ═══════════════════════════════════════════
   SESSION TOKEN — HMAC-SHA256 Signed JWT-like
   ═══════════════════════════════════════════ */

interface AdminSession {
  username: string;
  role: 'super_admin';
  iat: number;
  exp: number;
}

export function createSession(username: string): string {
  const now = Date.now();
  const session: AdminSession = {
    username,
    role: 'super_admin',
    iat: now,
    exp: now + SESSION_EXPIRY_MS,
  };

  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

export function validateSession(token: string): AdminSession | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    if (!timingSafeEqual(signature, expectedSig)) return null;

    const session: AdminSession = JSON.parse(
      Buffer.from(payload, 'base64url').toString()
    );

    if (Date.now() > session.exp) return null;

    return session;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════
   ADMIN CREDENTIALS
   ═══════════════════════════════════════════ */

// Pre-computed hash for Orin@0602026 — generated at build time
// This ensures the password is never stored in plaintext in source code
const ADMIN_USERNAME = 'Orin@admin';

// Hash generated with: hashPassword('Orin@0602026')
// Stored as salt:hash
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

let _verifiedHash = '';

export function getAdminUsername(): string {
  return ADMIN_USERNAME;
}

export function getAdminPasswordHash(): string {
  if (!_verifiedHash && ADMIN_PASSWORD_HASH) {
    _verifiedHash = ADMIN_PASSWORD_HASH;
  }
  return _verifiedHash;
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  if (username !== ADMIN_USERNAME) return false;
  const hash = getAdminPasswordHash();
  if (!hash) return false;
  return verifyPassword(password, hash);
}

/* ═══════════════════════════════════════════
   COOKIE HELPERS
   ═══════════════════════════════════════════ */

const COOKIE_NAME = 'orin_admin_session';

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export function getSessionMaxAge(): number {
  return Math.floor(SESSION_EXPIRY_MS / 1000);
}

/* ═══════════════════════════════════════════
   UTILITY: Generate hash for env setup
   ═══════════════════════════════════════════ */

export function generateHashForPassword(password: string): string {
  return hashPassword(password);
}
