/**
 * WasmBridge — Interface for Rust crypto functions compiled to WASM.
 * All functions are stubs until the WASM module is built and integrated.
 */

export function initWasmModule(_masterKey: Uint8Array): void {
  throw new Error(
    "NOT_IMPLEMENTED: load and initialize WASM crypto module with master key"
  )
}

export function encryptEntry(_plaintext: string): Uint8Array {
  throw new Error(
    "NOT_IMPLEMENTED: encrypt entry via WASM (XChaCha20-Poly1305)"
  )
}

export function decryptEntry(_ciphertext: Uint8Array): string {
  throw new Error(
    "NOT_IMPLEMENTED: decrypt entry via WASM (XChaCha20-Poly1305)"
  )
}

export function deriveSharedKey(
  _privateKey: Uint8Array,
  _publicKey: Uint8Array
): Uint8Array {
  throw new Error("NOT_IMPLEMENTED: X25519 key exchange via WASM module")
}

export function zeroizeMemory(): void {
  throw new Error(
    "NOT_IMPLEMENTED: zeroize all decrypted data from WASM linear memory"
  )
}
