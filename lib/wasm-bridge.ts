/**
 * Crypto bridge — all operations use native Expo module (no WASM).
 *
 * Android: javax.crypto (AES-GCM, PBKDF2), java.security (X25519)
 * iOS: CryptoKit (AES-GCM, X25519), CommonCrypto (PBKDF2)
 */
import {
  hashMasterPassword,
  verifyMasterPassword,
  deriveEncryptionKey,
  generateEncryptionSalt,
} from "./native-pbkdf2"
import {
  encryptAesGcm,
  decryptAesGcm,
  encryptAesGcmRaw,
  decryptAesGcmRaw,
  generateX25519Keypair as _generateX25519Keypair,
  x25519DeriveSharedKey as _x25519DeriveSharedKey,
  generateSalt,
} from "../modules/expo-vault-crypto"

console.log("[CryptoBridge] Using native Expo module (no WASM)")

// ---------------------------------------------------------------------------
// Initialization — no-op, kept for API compatibility
// ---------------------------------------------------------------------------

export function initWasm(): Promise<void> {
  return Promise.resolve()
}

export function isWasmReady(): boolean {
  return true
}

// ---------------------------------------------------------------------------
// Master password (PBKDF2) — re-export from native-pbkdf2
// ---------------------------------------------------------------------------

export { hashMasterPassword, verifyMasterPassword, deriveEncryptionKey, generateEncryptionSalt }

// ---------------------------------------------------------------------------
// Entry encryption (AES-256-GCM)
// ---------------------------------------------------------------------------

export function encryptEntry(
  entryJson: string,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  return encryptAesGcm(entryJson, keyHex)
}

export function decryptEntry(
  encryptedDataHex: string,
  nonceHex: string,
  keyHex: string,
): string {
  return decryptAesGcm(encryptedDataHex, nonceHex, keyHex)
}

// ---------------------------------------------------------------------------
// Raw data encryption (for shared vault keys)
// ---------------------------------------------------------------------------

export function encryptRaw(
  plaintextHex: string,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  return encryptAesGcmRaw(plaintextHex, keyHex)
}

export function decryptRaw(
  ciphertextHex: string,
  nonceHex: string,
  keyHex: string,
): string {
  return decryptAesGcmRaw(ciphertextHex, nonceHex, keyHex)
}

// ---------------------------------------------------------------------------
// X25519 key exchange
// ---------------------------------------------------------------------------

export function generateX25519Keypair(): { public_key: string; private_key: string } {
  return _generateX25519Keypair()
}

export function x25519DeriveSharedKey(
  privateKeyHex: string,
  publicKeyHex: string,
): string {
  return _x25519DeriveSharedKey(privateKeyHex, publicKeyHex)
}

export function generateSharedVaultKey(): string {
  // Generate random 32-byte key (hex)
  const saltB64 = generateSalt(32)
  // Convert base64 to hex
  const padded = saltB64 + "=".repeat((4 - (saltB64.length % 4)) % 4)
  const binary = atob(padded)
  let hex = ""
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, "0")
  }
  return hex
}

// ---------------------------------------------------------------------------
// Password generator (pure JS — no native needed)
// ---------------------------------------------------------------------------

export function generatePassword(
  length: number,
  lowercase: boolean,
  uppercase: boolean,
  digits: boolean,
  symbols: boolean,
): string {
  let charset = ""
  if (lowercase) charset += "abcdefghijklmnopqrstuvwxyz"
  if (uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  if (digits) charset += "0123456789"
  if (symbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

  if (charset.length === 0) charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

  // Use crypto-secure random
  const randomBytes = new Uint8Array(length)
  crypto.getRandomValues(randomBytes)

  let result = ""
  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % charset.length]
  }
  return result
}
