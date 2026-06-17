'use client';

/**
 * End-to-End Encryption utilities for secure messaging
 *
 * Protocol: ECDH (P-256) key exchange + AES-GCM encryption
 *
 * Flow:
 * 1. Each user generates an ECDH key pair on signup
 * 2. Public key is stored in DB, private key stays in IndexedDB
 * 3. To start a conversation, derive a shared secret from both users' keys
 * 4. Messages are encrypted with AES-GCM before leaving the client
 * 5. Server only ever sees encrypted ciphertext
 */

const DB_NAME = 'orin-e2e-keys';
const DB_STORE = 'key-pairs';
const DB_VERSION = 1;

// ═══════════════════════════════════════════
// INDEXEDDB HELPERS (private key storage)
// ═══════════════════════════════════════════

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'userId' });
      }
    };
  });
}

async function storePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ userId, privateKey, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).get(userId);
    request.onsuccess = () => resolve(request.result?.privateKey ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function deletePrivateKey(userId: string): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const db2 = db;
    const tx = db2.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(userId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ═══════════════════════════════════════════
// KEY GENERATION
// ═══════════════════════════════════════════

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/**
 * Generate an ECDH key pair for a user.
 * Returns the public key (to store in DB) and stores the private key in IndexedDB.
 */
export async function generateKeyPair(userId: string): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable for export
    ['deriveKey', 'deriveBits']
  );

  // Store private key in IndexedDB (never leaves the device)
  await storePrivateKey(userId, keyPair.privateKey);

  // Export public key to JWK for storage in DB
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return JSON.stringify(publicJwk);
}

/**
 * Get or create a key pair for a user.
 * Returns the public key as JWK string.
 */
export async function getOrCreateKeyPair(userId: string): Promise<string> {
  const existing = await getPrivateKey(userId);
  if (existing) {
    // Re-export the public key from the stored private key's associated data
    // We need to re-generate since we can't derive public from private with ECDH
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    await storePrivateKey(userId, keyPair.privateKey);
    const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    return JSON.stringify(publicJwk);
  }
  return generateKeyPair(userId);
}

// ═══════════════════════════════════════════
// SHARED SECRET DERIVATION (ECDH)
// ═══════════════════════════════════════════

/**
 * Derive a shared AES-GCM key from our private key and their public key.
 */
async function deriveSharedKey(
  privateKey: CryptoKey,
  theirPublicJwk: string
): Promise<CryptoKey> {
  const theirPublicKey = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(theirPublicJwk),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ═══════════════════════════════════════════
// ENCRYPTION / DECRYPTION
// ═══════════════════════════════════════════

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string;         // base64
  salt: string;       // base64 (for key derivation verification)
}

/**
 * Encrypt a message string using AES-GCM.
 */
export async function encryptMessage(
  sharedKey: CryptoKey,
  plaintext: string
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    data
  );

  // Convert to base64
  const ciphertextArray = new Uint8Array(encrypted);
  const ciphertext = btoa(String.fromCharCode(...ciphertextArray));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  // Random salt for verification
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = btoa(String.fromCharCode(...salt));

  return { ciphertext, iv: ivBase64, salt: saltBase64 };
}

/**
 * Decrypt an encrypted payload back to plaintext.
 */
export async function decryptMessage(
  sharedKey: CryptoKey,
  payload: EncryptedPayload
): Promise<string> {
  const ciphertextBytes = Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    sharedKey,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ═══════════════════════════════════════════
// CONVERSATION KEY MANAGEMENT
// ═══════════════════════════════════════════

/**
 * Get the shared encryption key for a conversation.
 * Requires our private key and the other participant's public key.
 */
export async function getConversationKey(
  currentUserId: string,
  theirPublicJwk: string
): Promise<CryptoKey> {
  const privateKey = await getPrivateKey(currentUserId);
  if (!privateKey) {
    throw new Error('Private key not found. Please log in again.');
  }
  return deriveSharedKey(privateKey, theirPublicJwk);
}

/**
 * Encrypt a message for a specific conversation.
 */
export async function encryptForConversation(
  currentUserId: string,
  theirPublicJwk: string,
  message: string
): Promise<EncryptedPayload> {
  const sharedKey = await getConversationKey(currentUserId, theirPublicJwk);
  return encryptMessage(sharedKey, message);
}

/**
 * Decrypt a message from a specific conversation.
 */
export async function decryptFromConversation(
  currentUserId: string,
  theirPublicJwk: string,
  payload: EncryptedPayload
): Promise<string> {
  const sharedKey = await getConversationKey(currentUserId, theirPublicJwk);
  return decryptMessage(sharedKey, payload);
}

/**
 * Check if we have a private key for this user (can decrypt messages).
 */
export async function hasPrivateKey(userId: string): Promise<boolean> {
  const key = await getPrivateKey(userId);
  return key !== null;
}

/**
 * Clear all keys (on logout).
 */
export async function clearAllKeys(): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
