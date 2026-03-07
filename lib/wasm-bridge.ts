/**
 * WasmBridge — loads the Rust WASM crypto module and exposes its API.
 *
 * Initialization uses `initSync` with the binary read from expo-asset.
 * All exported functions throw if called before `initWasm()` resolves.
 */
import * as FileSystem from "expo-file-system"
import { Asset } from "expo-asset"
import {
  initSync,
  init as wasmInit,
  hashMasterPassword as _hashMasterPassword,
  verifyMasterPassword as _verifyMasterPassword,
  deriveEncryptionKey as _deriveEncryptionKey,
  generateEncryptionSalt as _generateEncryptionSalt,
  encryptEntry as _encryptEntry,
  decryptEntry as _decryptEntry,
  encryptRaw as _encryptRaw,
  decryptRaw as _decryptRaw,
  generateX25519Keypair as _generateX25519Keypair,
  x25519DeriveSharedKey as _x25519DeriveSharedKey,
  generateSharedVaultKey as _generateSharedVaultKey,
  generatePassword as _generatePassword,
} from "./crypto-wasm/vault_crypto_wasm"

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let initialized = false
let initPromise: Promise<void> | null = null

/**
 * Load and initialize the WASM module. Safe to call multiple times —
 * subsequent calls return the same promise.
 */
export function initWasm(): Promise<void> {
  if (initialized) return Promise.resolve()
  if (initPromise) return initPromise

  initPromise = (async () => {
    // Load the .wasm asset bundled by Metro
    const [asset] = await Asset.loadAsync(
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("./crypto-wasm/vault_crypto_wasm_bg.wasm")
    )

    const fileUri = asset.localUri
    if (!fileUri) throw new Error("Failed to resolve WASM asset URI")

    // Read as base64, convert to ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Synchronous instantiation from buffer
    initSync(bytes.buffer)
    wasmInit()
    initialized = true
  })()

  initPromise.catch(() => {
    initPromise = null // allow retry on failure
  })

  return initPromise
}

export function isWasmReady(): boolean {
  return initialized
}

function assertReady() {
  if (!initialized) throw new Error("WASM module not initialized — call initWasm() first")
}

// ---------------------------------------------------------------------------
// Master password (PBKDF2 600K iterations, PHC string format)
// ---------------------------------------------------------------------------

export function hashMasterPassword(password: string): { hash: string; salt: string } {
  assertReady()
  return _hashMasterPassword(password)
}

export function verifyMasterPassword(password: string, hash: string): boolean {
  assertReady()
  return _verifyMasterPassword(password, hash)
}

// ---------------------------------------------------------------------------
// Encryption key derivation
// ---------------------------------------------------------------------------

export function deriveEncryptionKey(password: string, salt: string): string {
  assertReady()
  return _deriveEncryptionKey(password, salt)
}

export function generateEncryptionSalt(): string {
  assertReady()
  return _generateEncryptionSalt()
}

// ---------------------------------------------------------------------------
// Entry encryption (AES-256-GCM)
// ---------------------------------------------------------------------------

export function encryptEntry(
  entryJson: string,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  assertReady()
  return _encryptEntry(entryJson, keyHex)
}

export function decryptEntry(
  encryptedDataHex: string,
  nonceHex: string,
  keyHex: string,
): string {
  assertReady()
  return _decryptEntry(encryptedDataHex, nonceHex, keyHex)
}

// ---------------------------------------------------------------------------
// Raw data encryption (for shared vault keys)
// ---------------------------------------------------------------------------

export function encryptRaw(
  plaintextHex: string,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  assertReady()
  return _encryptRaw(plaintextHex, keyHex)
}

export function decryptRaw(
  ciphertextHex: string,
  nonceHex: string,
  keyHex: string,
): string {
  assertReady()
  return _decryptRaw(ciphertextHex, nonceHex, keyHex)
}

// ---------------------------------------------------------------------------
// X25519 key exchange
// ---------------------------------------------------------------------------

export function generateX25519Keypair(): { public_key: string; private_key: string } {
  assertReady()
  return _generateX25519Keypair()
}

export function x25519DeriveSharedKey(
  privateKeyHex: string,
  publicKeyHex: string,
): string {
  assertReady()
  return _x25519DeriveSharedKey(privateKeyHex, publicKeyHex)
}

export function generateSharedVaultKey(): string {
  assertReady()
  return _generateSharedVaultKey()
}

// ---------------------------------------------------------------------------
// Password generator
// ---------------------------------------------------------------------------

export function generatePassword(
  length: number,
  lowercase: boolean,
  uppercase: boolean,
  digits: boolean,
  symbols: boolean,
): string {
  assertReady()
  return _generatePassword(length, lowercase, uppercase, digits, symbols)
}
