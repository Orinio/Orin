import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Token Encryption at Rest
 * 
 * Uses AES-256-GCM for authenticated encryption.
 * Tokens are encrypted before storage and decrypted on read.
 * 
 * Requires ENCRYPTION_KEY env var (32 bytes hex = 64 chars).
 * Falls back to no encryption in development with a warning.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

let _warned = false;

function getKey(): Buffer | null {
  if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === 'production' && !_warned) {
      console.error('[crypto] ENCRYPTION_KEY not set — token encryption disabled in production!');
      _warned = true;
    }
    return null;
  }
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext; // No encryption in dev without key

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptToken(encryptedToken: string): string {
  const key = getKey();
  if (!key) return encryptedToken; // No decryption in dev without key

  // Check if token is in encrypted format
  const parts = encryptedToken.split(':');
  if (parts.length !== 3) return encryptedToken; // Legacy plaintext token

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    // Decryption failed — token may be legacy plaintext
    return encryptedToken;
  }
}

export function isTokenEncrypted(token: string): boolean {
  const parts = token.split(':');
  return parts.length === 3;
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
