import { requireNativeModule } from "expo-modules-core"

interface NativeModule {
  pbkdf2(password: string, saltBase64: string, iterations: number, keyLength: number): string
  generateSalt(byteLength: number): string
  encryptAesGcm(plaintext: string, keyHex: string): { encrypted_data: string; nonce: string }
  decryptAesGcm(ciphertextHex: string, nonceHex: string, keyHex: string): string
  encryptAesGcmRaw(plaintextHex: string, keyHex: string): { encrypted_data: string; nonce: string }
  decryptAesGcmRaw(ciphertextHex: string, nonceHex: string, keyHex: string): string
  generateX25519Keypair(): { public_key: string; private_key: string }
  x25519DeriveSharedKey(privateKeyHex: string, publicKeyHex: string): string
}

const NativeCrypto = requireNativeModule<NativeModule>("ExpoVaultCrypto")

/** PBKDF2-HMAC-SHA256. Returns hex-encoded derived key. */
export function pbkdf2(
  password: string,
  saltBase64: string,
  iterations: number,
  keyLength: number,
): string {
  return NativeCrypto.pbkdf2(password, saltBase64, iterations, keyLength)
}

/** Generate random bytes. Returns base64 (no padding). */
export function generateSalt(byteLength: number): string {
  return NativeCrypto.generateSalt(byteLength)
}

/** AES-256-GCM encrypt a UTF-8 string. Returns hex ciphertext+tag and hex nonce. */
export function encryptAesGcm(
  plaintext: string,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  return NativeCrypto.encryptAesGcm(plaintext, keyHex)
}

/** AES-256-GCM decrypt. Returns the original UTF-8 string. */
export function decryptAesGcm(
  ciphertextHex: string,
  nonceHex: string,
  keyHex: string,
): string {
  return NativeCrypto.decryptAesGcm(ciphertextHex, nonceHex, keyHex)
}

/** AES-256-GCM encrypt raw hex bytes. Returns hex ciphertext+tag and hex nonce. */
export function encryptAesGcmRaw(
  plaintextHex: string,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  return NativeCrypto.encryptAesGcmRaw(plaintextHex, keyHex)
}

/** AES-256-GCM decrypt raw. Returns hex-encoded plaintext. */
export function decryptAesGcmRaw(
  ciphertextHex: string,
  nonceHex: string,
  keyHex: string,
): string {
  return NativeCrypto.decryptAesGcmRaw(ciphertextHex, nonceHex, keyHex)
}

/** Generate X25519 keypair. Returns hex public_key and private_key. */
export function generateX25519Keypair(): { public_key: string; private_key: string } {
  return NativeCrypto.generateX25519Keypair()
}

/** X25519 Diffie-Hellman. Returns hex shared key (32 bytes). */
export function x25519DeriveSharedKey(
  privateKeyHex: string,
  publicKeyHex: string,
): string {
  return NativeCrypto.x25519DeriveSharedKey(privateKeyHex, publicKeyHex)
}
