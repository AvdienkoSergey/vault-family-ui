/**
 * Tests for native PBKDF2 implementation.
 *
 * NOTE: These tests require the native Expo module (expo-vault-crypto)
 * and can only run on device/emulator, not in Node.js.
 * For CI, use integration tests via Detox or similar.
 *
 * This file is kept as a reference for the expected behavior.
 */

describe("native-pbkdf2 (requires device)", () => {
  it.todo("should return PHC format hash from hashMasterPassword")
  it.todo("should verify correct password")
  it.todo("should reject wrong password")
  it.todo("should derive a 32-byte hex key")
  it.todo("should be deterministic for same inputs")
  it.todo("should generate hex encryption salt")
})
