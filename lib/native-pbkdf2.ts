/**
 * Native PBKDF2 using the local Expo module.
 * Android: javax.crypto.SecretKeyFactory (PBKDF2WithHmacSHA256)
 * iOS: CommonCrypto CCKeyDerivationPBKDF
 *
 * PHC format: $pbkdf2-sha256$i=<iterations>$<base64-salt-no-padding>$<base64-hash-no-padding>
 */

import { pbkdf2, generateSalt } from "../modules/expo-vault-crypto"

const ITERATIONS = 600_000
const KEY_LENGTH = 32 // bytes

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function hexFromBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/=+$/, "")
}

function bytesFromBase64(b64: string): Uint8Array {
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Hash a master password using PBKDF2-HMAC-SHA256.
 * Returns a PHC-format string and the salt used.
 */
export async function hashMasterPassword(
  password: string,
): Promise<{ hash: string; salt: string }> {
  const saltB64 = generateSalt(16)
  const derivedHex = pbkdf2(password, saltB64, ITERATIONS, KEY_LENGTH)
  const derivedBytes = hexToBytes(derivedHex)
  const hashB64 = base64FromBytes(derivedBytes)
  const phc = `$pbkdf2-sha256$i=${ITERATIONS}$${saltB64}$${hashB64}`
  return { hash: phc, salt: saltB64 }
}

/**
 * Verify a password against a PHC-format hash string.
 */
export async function verifyMasterPassword(
  password: string,
  phcHash: string,
): Promise<boolean> {
  const parts = phcHash.split("$")
  if (parts.length < 5 || parts[1] !== "pbkdf2-sha256") return false

  const iterations = parseInt(parts[2].split("=")[1], 10)
  const saltB64 = parts[3]
  const expectedHash = bytesFromBase64(parts[4])

  const derivedHex = pbkdf2(password, saltB64, iterations, expectedHash.length)

  // Constant-time comparison
  let diff = 0
  for (let i = 0; i < expectedHash.length; i++) {
    const derivedByte = parseInt(derivedHex.substring(i * 2, i * 2 + 2), 16)
    diff |= derivedByte ^ expectedHash[i]
  }
  return diff === 0
}

/**
 * Derive an encryption key from password + hex salt string.
 * The salt is used as raw ASCII string bytes (matching server behavior).
 * Returns a 32-byte hex-encoded key.
 */
export async function deriveEncryptionKey(
  password: string,
  saltHex: string,
): Promise<string> {
  // Server passes the hex string as raw ASCII bytes to PBKDF2.
  // Our native module expects base64 salt, so encode the raw ASCII bytes as base64.
  const encoder = new TextEncoder()
  const saltBytes = encoder.encode(saltHex)
  const saltB64 = base64FromBytes(saltBytes)
  return pbkdf2(password, saltB64, ITERATIONS, KEY_LENGTH)
}

/**
 * Generate a random encryption salt (hex string).
 */
export function generateEncryptionSalt(): string {
  const saltB64 = generateSalt(16)
  const bytes = bytesFromBase64(saltB64)
  return hexFromBytes(bytes)
}
