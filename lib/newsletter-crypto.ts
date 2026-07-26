/*
 * Newsletter secrets stay outside D1. The runtime provides base64 encoded
 * key material through bindings; this module never writes plaintext or keys
 * to logs. Ciphertext and nonces are base64 encoded for D1 portability.
 */

const EMAIL_AAD_PREFIX = "orbita:newsletter:email:v";
const AES_KEY_BYTES = 32;
const GCM_NONCE_BYTES = 12;
const TOKEN_BYTES = 32;

export type NewsletterSecret = string | Uint8Array | ArrayBuffer | CryptoKey;

export type EncryptedEmail = {
  ciphertext: string;
  nonce: string;
  keyVersion: number;
};

function subtleCrypto(): SubtleCrypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto is required for newsletter secrets");
  }
  return globalThis.crypto.subtle;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error("Newsletter secret must be base64 encoded");
  }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(bytes: Uint8Array): string {
  return encodeBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function secretBytes(secret: Exclude<NewsletterSecret, CryptoKey>): Uint8Array {
  if (typeof secret === "string") return decodeBase64(secret);
  if (secret instanceof Uint8Array) return new Uint8Array(secret);
  return new Uint8Array(secret);
}

function isCryptoKey(value: NewsletterSecret): value is CryptoKey {
  return typeof value === "object" && value !== null && "type" in value && "algorithm" in value;
}

async function aesKey(secret: NewsletterSecret): Promise<CryptoKey> {
  if (isCryptoKey(secret)) return secret;
  const bytes = secretBytes(secret);
  if (bytes.byteLength !== AES_KEY_BYTES) {
    throw new Error("Newsletter AES secret must decode to exactly 32 bytes");
  }
  return subtleCrypto().importKey("raw", asArrayBuffer(bytes), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function hmacKey(secret: NewsletterSecret): Promise<CryptoKey> {
  if (isCryptoKey(secret)) return secret;
  const bytes = secretBytes(secret);
  if (bytes.byteLength !== AES_KEY_BYTES) {
    throw new Error("Newsletter HMAC secret must decode to exactly 32 bytes");
  }
  return subtleCrypto().importKey("raw", asArrayBuffer(bytes), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function checkKeyVersion(keyVersion: number): number {
  if (!Number.isSafeInteger(keyVersion) || keyVersion < 1) throw new Error("Newsletter keyVersion must be a positive integer");
  return keyVersion;
}

export function normalizeEmail(email: string): string {
  if (typeof email !== "string") throw new TypeError("Email must be a string");
  const normalized = email.normalize("NFKC").trim().toLowerCase();
  if (!normalized || normalized.length > 254 || normalized.includes("\u0000")) {
    throw new Error("Email is not valid for newsletter storage");
  }
  return normalized;
}

export function maskEmail(email: string): string {
  let normalized: string;
  try {
    normalized = normalizeEmail(email);
  } catch {
    return "***";
  }

  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) return "***";
  const local = normalized.slice(0, separator);
  const domain = normalized.slice(separator + 1);
  if (local.length === 1) return `*@${domain}`;
  if (local.length === 2) return `${local[0]}*@${domain}`;
  return `${local[0]}***${local.at(-1)}@${domain}`;
}

export async function encryptEmail(email: string, secret: NewsletterSecret, keyVersion = 1): Promise<EncryptedEmail> {
  const version = checkKeyVersion(keyVersion);
  const nonce = new Uint8Array(GCM_NONCE_BYTES);
  globalThis.crypto.getRandomValues(nonce);
  const plaintext = new TextEncoder().encode(normalizeEmail(email));
  const aad = new TextEncoder().encode(`${EMAIL_AAD_PREFIX}${version}`);
  const ciphertext = await subtleCrypto().encrypt({ name: "AES-GCM", iv: asArrayBuffer(nonce), additionalData: asArrayBuffer(aad) }, await aesKey(secret), asArrayBuffer(plaintext));
  return { ciphertext: encodeBase64(new Uint8Array(ciphertext)), nonce: encodeBase64(nonce), keyVersion: version };
}

export async function decryptEmail(payload: EncryptedEmail, secret: NewsletterSecret): Promise<string>;
export async function decryptEmail(ciphertext: string, nonce: string, secret: NewsletterSecret, keyVersion?: number): Promise<string>;
export async function decryptEmail(
  payloadOrCiphertext: EncryptedEmail | string,
  secretOrNonce: NewsletterSecret | string,
  maybeSecret?: NewsletterSecret,
  maybeKeyVersion = 1,
): Promise<string> {
  const payload: EncryptedEmail = typeof payloadOrCiphertext === "string"
    ? { ciphertext: payloadOrCiphertext, nonce: String(secretOrNonce), keyVersion: maybeKeyVersion }
    : payloadOrCiphertext;
  const secret = typeof payloadOrCiphertext === "string" ? maybeSecret : secretOrNonce;
  if (!secret) throw new Error("Newsletter decrypt secret is required");
  const version = checkKeyVersion(payload.keyVersion);
  const nonce = decodeBase64(payload.nonce);
  if (nonce.byteLength !== GCM_NONCE_BYTES) throw new Error("Newsletter nonce must be 12 bytes");
  const ciphertext = decodeBase64(payload.ciphertext);
  const aad = new TextEncoder().encode(`${EMAIL_AAD_PREFIX}${version}`);
  const plaintext = await subtleCrypto().decrypt({ name: "AES-GCM", iv: asArrayBuffer(nonce), additionalData: asArrayBuffer(aad) }, await aesKey(secret), asArrayBuffer(ciphertext));
  return normalizeEmail(new TextDecoder().decode(plaintext));
}

export async function blindIndex(email: string, secret: NewsletterSecret): Promise<string> {
  return hmacValue(normalizeEmail(email), secret);
}

export async function hmacValue(value: string, secret: NewsletterSecret): Promise<string> {
  if (typeof value !== "string" || !value) throw new Error("Newsletter HMAC input is required");
  const input = new TextEncoder().encode(value.normalize("NFKC"));
  const digest = await subtleCrypto().sign("HMAC", await hmacKey(secret), asArrayBuffer(input));
  return bytesToHex(new Uint8Array(digest));
}

export async function hashToken(token: string): Promise<string> {
  if (typeof token !== "string" || token.length < 16 || token.length > 512) throw new Error("Newsletter token has an invalid length");
  const digest = await subtleCrypto().digest("SHA-256", asArrayBuffer(new TextEncoder().encode(token)));
  return bytesToHex(new Uint8Array(digest));
}

export function generateToken(byteLength = TOKEN_BYTES): string {
  if (!Number.isSafeInteger(byteLength) || byteLength < 16 || byteLength > 96) throw new Error("Newsletter token length must be between 16 and 96 bytes");
  const token = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(token);
  return encodeBase64Url(token);
}
