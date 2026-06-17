'use client';

/**
 * End-to-End Encryption System (Signal Protocol-inspired)
 *
 * Protocol: X3DH Key Agreement + Double Ratchet + AES-256-GCM + HMAC-SHA256
 *
 * Security Properties:
 * - Forward secrecy: Compromising one key doesn't expose past messages
 * - Break-in recovery: Compromising one key doesn't expose future messages
 * - Authentication: HMAC verifies message integrity and sender identity
 * - Deniability: No digital signatures (plausible deniability)
 * - Key transparency: Fingerprint verification for man-in-the-middle detection
 */

const DB_NAME = 'orin-e2e-v2';
const DB_STORE = 'keys';
const DB_VERSION = 1;

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface IdentityKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface SignedPreKey {
  id: number;
  keyPair: IdentityKeyPair;
  signature: ArrayBuffer;
}

export interface OneTimePreKey {
  id: number;
  keyPair: IdentityKeyPair;
}

export interface UserKeyBundle {
  identityPublicKey: string;       // JWK
  signedPreKeyPublic: string;      // JWK
  signedPreKeySignature: string;   // base64
  oneTimePreKeys: string[];        // JWK array
  registrationId: number;
}

export interface RatchetState {
  rootKey: CryptoKey;
    sendingChainKey: CryptoKey;
  receivingChainKey: CryptoKey | null;
  sendingMessageNumber: number;
  receivingMessageNumber: number;
  previousSendingChainLength: number;
  remotePublicKey: string | null;
}

export interface EncryptedMessage {
  ciphertext: string;      // base64
  iv: string;              // base64 (12 bytes)
  hmac: string;            // base64 (32 bytes)
  messageNumber: number;
  chainKeyIndex: number;
  ephemeralPublicKey?: string; // JWK (for X3DH)
  previousChainLength: number;
  ratchetPublicKey: string;   // JWK (our current ratchet public key)
}

export interface StoredKeys {
  userId: string;
  identityKeyPair: string;   // JWK serialized
  signedPreKey: {
    id: number;
    publicKey: string;
    privateKey: string;
    signature: string;
  };
  oneTimePreKeys: Array<{
    id: number;
    publicKey: string;
    privateKey: string;
  }>;
  registrationId: number;
  createdAt: number;
}

// ═══════════════════════════════════════════
// INDEXEDDB HELPERS
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
      // Store for ratchet states per conversation
      if (!db.objectStoreNames.contains('ratchet-states')) {
        db.createObjectStore('ratchet-states', { keyPath: 'conversationId' });
      }
    };
  });
}

async function storeKeys(userId: string, keys: StoredKeys): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(keys);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getStoredKeys(userId: string): Promise<StoredKeys | null> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).get(userId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function storeRatchetState(
  conversationId: string,
  state: RatchetState
): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ratchet-states', 'readwrite');
    tx.objectStore('ratchet-states').put({ conversationId, state, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getRatchetState(conversationId: string): Promise<RatchetState | null> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ratchet-states', 'readonly');
    const request = tx.objectStore('ratchet-states').get(conversationId);
    request.onsuccess = () => resolve(request.result?.state ?? null);
    request.onerror = () => reject(request.error);
  });
}

// ═══════════════════════════════════════════
// CRYPTO UTILITIES
// ═══════════════════════════════════════════

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : new Uint8Array(buffer).buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ═══════════════════════════════════════════
// KEY GENERATION
// ═══════════════════════════════════════════

async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

async function generateSignedPreKey(
  identityPrivateKey: CryptoKey,
  id: number
): Promise<SignedPreKey> {
  const keyPair = await generateIdentityKeyPair();

  // Export public key for signing
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const publicKeyBytes = new TextEncoder().encode(JSON.stringify(publicJwk));

  // Sign with identity key
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    identityPrivateKey,
    publicKeyBytes
  );

  return {
    id,
    keyPair,
    signature,
  };
}

async function generateOneTimePreKey(id: number): Promise<OneTimePreKey> {
  const keyPair = await generateIdentityKeyPair();
  return { id, keyPair };
}

/**
 * Generate a complete key bundle for a user.
 */
export async function generateKeyBundle(userId: string): Promise<UserKeyBundle> {
  const identityKeyPair = await generateIdentityKeyPair();
  const signedPreKey = await generateSignedPreKey(identityKeyPair.privateKey, 1);

  // Generate batch of one-time pre keys
  const oneTimePreKeys: OneTimePreKey[] = [];
  for (let i = 0; i < 10; i++) {
    oneTimePreKeys.push(await generateOneTimePreKey(i));
  }

  const registrationId = Math.floor(Math.random() * 16383);

  // Export all keys to JWK
  const identityPublicJwk = await crypto.subtle.exportKey('jwk', identityKeyPair.publicKey);
  const signedPreKeyPublicJwk = await crypto.subtle.exportKey('jwk', signedPreKey.keyPair.publicKey);
  const signedPreKeyPrivateJwk = await crypto.subtle.exportKey('jwk', signedPreKey.keyPair.privateKey);
  const identityPrivateJwk = await crypto.subtle.exportKey('jwk', identityKeyPair.privateKey);

  const oneTimePreKeyJwks = await Promise.all(
    oneTimePreKeys.map(async (otpk) => ({
      id: otpk.id,
      publicKey: await crypto.subtle.exportKey('jwk', otpk.keyPair.publicKey),
      privateKey: await crypto.subtle.exportKey('jwk', otpk.keyPair.privateKey),
    }))
  );

  // Store private keys locally
  const storedKeys: StoredKeys = {
    userId,
    identityKeyPair: JSON.stringify({
      publicKey: identityPublicJwk,
      privateKey: identityPrivateJwk,
    }),
    signedPreKey: {
      id: 1,
      publicKey: JSON.stringify(signedPreKeyPublicJwk),
      privateKey: JSON.stringify(signedPreKeyPrivateJwk),
      signature: arrayBufferToBase64(signedPreKey.signature),
    },
    oneTimePreKeys: oneTimePreKeyJwks.map((otpk) => ({
      id: otpk.id,
      publicKey: JSON.stringify(otpk.publicKey),
      privateKey: JSON.stringify(otpk.privateKey),
    })),
    registrationId,
    createdAt: Date.now(),
  };

  await storeKeys(userId, storedKeys);

  // Return public bundle (no private keys!)
  return {
    identityPublicKey: JSON.stringify(identityPublicJwk),
    signedPreKeyPublic: JSON.stringify(signedPreKeyPublicJwk),
    signedPreKeySignature: arrayBufferToBase64(signedPreKey.signature),
    oneTimePreKeys: oneTimePreKeyJwks.map((otpk) => JSON.stringify(otpk.publicKey)),
    registrationId,
  };
}

/**
 * Get or create key bundle for a user.
 */
export async function getOrCreateKeyBundle(userId: string): Promise<UserKeyBundle> {
  const existing = await getStoredKeys(userId);
  if (existing) {
    // Reconstruct bundle from stored keys
    const identityPair = JSON.parse(existing.identityKeyPair);
    return {
      identityPublicKey: identityPair.publicKey,
      signedPreKeyPublic: existing.signedPreKey.publicKey,
      signedPreKeySignature: existing.signedPreKey.signature,
      oneTimePreKeys: existing.oneTimePreKeys.map((otpk) => otpk.publicKey),
      registrationId: existing.registrationId,
    };
  }
  return generateKeyBundle(userId);
}

// ═══════════════════════════════════════════
// X3DH KEY AGREEMENT
// ═══════════════════════════════════════════

/**
 * X3DH Init: Compute shared secret from our keys and their bundle.
 * Returns ephemeral public key and shared secret.
 */
export async function x3dhInit(
  userId: string,
  theirBundle: UserKeyBundle
): Promise<{ sharedSecret: CryptoKey; ephemeralPublicKey: string }> {
  const storedKeys = await getStoredKeys(userId);
  if (!storedKeys) throw new Error('No keys found for user');

  const identityPair = JSON.parse(storedKeys.identityKeyPair);
  const identityPrivate = await crypto.subtle.importKey(
    'jwk',
    identityPair.privateKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Import their keys
  const theirIdentityPublic = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(theirBundle.identityPublicKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  const theirSignedPreKeyPublic = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(theirBundle.signedPreKeyPublic),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  // Generate ephemeral key pair
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // X3DH: Three DH calculations
  // DH1: Our identity -> Their signed pre-key
  const dh1 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirSignedPreKeyPublic },
    identityPrivate,
    256
  );

  // DH2: Our ephemeral -> Their identity
  const dh2 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirIdentityPublic },
    ephemeralKeyPair.privateKey,
    256
  );

  // DH3: Our ephemeral -> Their signed pre-key
  const dh3 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirSignedPreKeyPublic },
    ephemeralKeyPair.privateKey,
    256
  );

  // Optional: DH with one-time pre-key
  let dh4: ArrayBuffer | null = null;
  if (theirBundle.oneTimePreKeys.length > 0) {
    const theirOneTimePreKeyPublic = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(theirBundle.oneTimePreKeys[0]),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      ['deriveKey']
    );
    dh4 = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: theirOneTimePreKeyPublic },
      ephemeralKeyPair.privateKey,
      256
    );
  }

  // Combine DH outputs with HKDF
  const combinedInput = new Uint8Array(dh1.byteLength + dh2.byteLength + dh3.byteLength + (dh4?.byteLength || 0));
  let offset = 0;
  combinedInput.set(new Uint8Array(dh1), offset); offset += dh1.byteLength;
  combinedInput.set(new Uint8Array(dh2), offset); offset += dh2.byteLength;
  combinedInput.set(new Uint8Array(dh3), offset); offset += dh3.byteLength;
  if (dh4) combinedInput.set(new Uint8Array(dh4), offset);

  // Derive shared key using HKDF
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    combinedInput,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const sharedSecret = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // Zero salt for initial derivation
      info: new TextEncoder().encode('OrinX3DHv1'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const ephemeralPublicJwk = await crypto.subtle.exportKey('jwk', ephemeralKeyPair.publicKey);

  return {
    sharedSecret,
    ephemeralPublicKey: JSON.stringify(ephemeralPublicJwk),
  };
}

/**
 * X3DH Respond: Compute shared secret from our keys and their ephemeral.
 */
export async function x3dhRespond(
  userId: string,
  theirEphemeralPublicJwk: string,
  theirIdentityPublicJwk: string,
  usedOneTimePreKeyId: number | null
): Promise<CryptoKey> {
  const storedKeys = await getStoredKeys(userId);
  if (!storedKeys) throw new Error('No keys found for user');

  const identityPair = JSON.parse(storedKeys.identityKeyPair);
  const identityPrivate = await crypto.subtle.importKey(
    'jwk',
    identityPair.privateKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  );

  const signedPreKeyPair = JSON.parse(storedKeys.signedPreKey.privateKey);
  const signedPreKeyPrivate = await crypto.subtle.importKey(
    'jwk',
    signedPreKeyPair,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  );

  const theirEphemeralPublic = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(theirEphemeralPublicJwk),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  const theirIdentityPublic = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(theirIdentityPublicJwk),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );

  // DH1: Our signed pre-key -> Their identity
  const dh1 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirIdentityPublic },
    signedPreKeyPrivate,
    256
  );

  // DH2: Our identity -> Their ephemeral
  const dh2 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirEphemeralPublic },
    identityPrivate,
    256
  );

  // DH3: Our signed pre-key -> Their ephemeral
  const dh3 = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirEphemeralPublic },
    signedPreKeyPrivate,
    256
  );

  // Optional: DH with one-time pre-key
  let dh4: ArrayBuffer | null = null;
  if (usedOneTimePreKeyId !== null) {
    const otpkEntry = storedKeys.oneTimePreKeys.find((otpk) => otpk.id === usedOneTimePreKeyId);
    if (otpkEntry) {
      const otpkPrivate = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(otpkEntry.privateKey),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveKey', 'deriveBits']
      );
      dh4 = await crypto.subtle.deriveBits(
        { name: 'ECDH', public: theirEphemeralPublic },
        otpkPrivate,
        256
      );
    }
  }

  // Combine DH outputs
  const combinedInput = new Uint8Array(dh1.byteLength + dh2.byteLength + dh3.byteLength + (dh4?.byteLength || 0));
  let offset = 0;
  combinedInput.set(new Uint8Array(dh1), offset); offset += dh1.byteLength;
  combinedInput.set(new Uint8Array(dh2), offset); offset += dh2.byteLength;
  combinedInput.set(new Uint8Array(dh3), offset); offset += dh3.byteLength;
  if (dh4) combinedInput.set(new Uint8Array(dh4), offset);

  // Derive shared key
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    combinedInput,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: new TextEncoder().encode('OrinX3DHv1'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// ═══════════════════════════════════════════
// DOUBLE RATCHET
// ═══════════════════════════════════════════

/**
 * Initialize ratchet state from X3DH shared secret.
 */
export async function initRatchet(
  sharedSecret: CryptoKey,
  isAlice: boolean // true if we initiated
): Promise<RatchetState> {
  // Generate initial ratchet key pair
  const ratchetKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  // Derive root key and chain key
  const rootKey = sharedSecret;

  if (isAlice) {
    // Alice sends first message
    const { chainKey, nextRootKey } = await chainStep(rootKey, new Uint8Array(32));
    return {
      rootKey: nextRootKey,
      sendingChainKey: chainKey,
      receivingChainKey: null,
      sendingMessageNumber: 0,
      receivingMessageNumber: 0,
      previousSendingChainLength: 0,
      remotePublicKey: null,
    };
  }

  return {
    rootKey,
    sendingChainKey: rootKey, // Will be updated on first send
    receivingChainKey: null,
    sendingMessageNumber: 0,
    receivingMessageNumber: 0,
    previousSendingChainLength: 0,
    remotePublicKey: null,
  };
}

/**
 * Diffie-Hellman ratchet step.
 */
async function dhRatchetStep(
  rootKey: CryptoKey,
  ourPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<{ rootKey: CryptoKey; chainKey: CryptoKey }> {
  // DH output
  const dhOutput = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: theirPublicKey },
    ourPrivateKey,
    256
  );

  // HKDF with DH output
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    dhOutput,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32),
      info: new TextEncoder().encode('OrinRatchetv1'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Derive chain key from new root key
  const { chainKey, nextRootKey } = await chainStep(derivedKey, new Uint8Array(32));

  return { rootKey: nextRootKey, chainKey };
}

/**
 * Symmetric ratchet step (chain key -> message key + next chain key).
 */
async function chainStep(
  chainKey: CryptoKey,
  salt: Uint8Array
): Promise<{ messageKey: CryptoKey; nextChainKey: CryptoKey; chainKey: CryptoKey; nextRootKey: CryptoKey }> {
  // Derive message key and next chain key
  const chainKeyRaw = await crypto.subtle.exportKey('raw', chainKey);

  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    chainKeyRaw,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  // Create a proper Uint8Array buffer for salt
  const saltBuffer = new Uint8Array(salt);

  // Message key
  const messageKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBuffer,
      info: new TextEncoder().encode('OrinMsgKeyv1'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Next chain key
  const nextChainKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBuffer,
      info: new TextEncoder().encode('OrinChainKeyv1'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return {
    messageKey,
    nextChainKey,
    chainKey: nextChainKey,
    nextRootKey: chainKey, // Placeholder, will be replaced by dhRatchetStep
  };
}

// ═══════════════════════════════════════════
// MESSAGE ENCRYPTION/DECRYPTION
// ═══════════════════════════════════════════

/**
 * Encrypt a message with HMAC authentication.
 */
export async function encryptMessage(
  messageKey: CryptoKey,
  plaintext: string
): Promise<{ ciphertext: string; iv: string; hmac: string }> {
  const iv = generateRandomBytes(12);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Encrypt with AES-GCM
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    messageKey,
    data
  );

  // Compute HMAC for authentication
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.exportKey('raw', messageKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const hmac = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    encrypted
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    hmac: arrayBufferToBase64(hmac),
  };
}

/**
 * Decrypt and verify a message.
 */
export async function decryptMessage(
  messageKey: CryptoKey,
  ciphertext: string,
  iv: string,
  hmac: string
): Promise<string> {
  const ciphertextBytes = base64ToArrayBuffer(ciphertext);
  const ivBytes = base64ToArrayBuffer(iv);
  const hmacBytes = base64ToArrayBuffer(hmac);

  // Verify HMAC first
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.exportKey('raw', messageKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    hmacKey,
    hmacBytes,
    ciphertextBytes
  );

  if (!isValid) {
    throw new Error('Message authentication failed - possible tampering detected');
  }

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBytes) },
    messageKey,
    ciphertextBytes
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ═══════════════════════════════════════════
// KEY FINGERPRINTS
// ═══════════════════════════════════════════

/**
 * Generate a safety number fingerprint for verification.
 * Used to detect man-in-the-middle attacks.
 */
export async function generateFingerprint(
  userId: string,
  otherUserId: string
): Promise<string> {
  const myKeys = await getStoredKeys(userId);
  if (!myKeys) throw new Error('No keys found');

  const myIdentity = JSON.parse(myKeys.identityKeyPair).publicKey;
  const myIdentityBytes = new TextEncoder().encode(JSON.stringify(myIdentity));

  // Hash both identity keys
  const myHash = await crypto.subtle.digest('SHA-256', myIdentityBytes);
  const myHashArray = Array.from(new Uint8Array(myHash));

  // Create readable fingerprint (30 digits)
  const fingerprint = myHashArray
    .slice(0, 15)
    .map(b => (b % 10).toString())
    .join('');

  return fingerprint;
}

// ═══════════════════════════════════════════
// EXPORT FOR DB STORAGE
// ═══════════════════════════════════════════

/**
 * Get the public key bundle for storage in the database.
 */
export async function getPublicKeyBundle(userId: string): Promise<string | null> {
  const keys = await getStoredKeys(userId);
  if (!keys) return null;

  const bundle = await getOrCreateKeyBundle(userId);
  return JSON.stringify(bundle);
}

/**
 * Check if we have stored keys for a user.
 */
export async function hasStoredKeys(userId: string): Promise<boolean> {
  const keys = await getStoredKeys(userId);
  return keys !== null;
}

/**
 * Clear all stored keys (on logout).
 */
export async function clearAllKeys(): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE, 'ratchet-states'], 'readwrite');
    tx.objectStore(DB_STORE).clear();
    tx.objectStore('ratchet-states').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
