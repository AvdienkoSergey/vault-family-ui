/**
 * Master key management — two-layer encryption architecture.
 *
 * v1 (legacy): password -> PBKDF2 -> master_key -> encrypts entries directly
 * v2 (current): password -> PBKDF2 -> master_key -> decrypts vault_key (random 256-bit)
 *               vault_key -> encrypts entries
 *
 * Benefits of v2:
 * - Password change only re-encrypts vault_key (1 op), not all entries
 * - vault_key is high-entropy random, not derived from password
 * - Aligns with 1Password/Bitwarden architecture
 */
import * as FileSystem from "expo-file-system"
import type { Email, Password } from "./types"
import {
  hashMasterPassword,
  verifyMasterPassword,
  deriveEncryptionKey,
  generateEncryptionSalt,
  encryptRaw,
  decryptRaw,
  generateSharedVaultKey,
} from "./crypto-bridge"

const USERS_ROOT = `${FileSystem.documentDirectory}users/`
const MASTER_KEY_FILE = "master.key"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MasterKeyDataV1 {
  hash: string
  encryption_salt: string
  version: 1
}

interface MasterKeyDataV2 {
  /** PHC-format hash (contains iterations + salt inside) */
  hash: string
  /** Salt for deriving master_key via PBKDF2 (hex) */
  encryption_salt: string
  /** Random vault_key encrypted with master_key (AES-256-GCM, hex) */
  encrypted_vault_key: string
  /** Nonce for vault_key encryption (hex) */
  vault_key_nonce: string
  version: 2
}

export type MasterKeyData = MasterKeyDataV1 | MasterKeyDataV2

export interface UnlockResult {
  /** The key to use for encrypting/decrypting entries */
  vaultKey: string
  /** True if v1 -> v2 migration is needed (re-encrypt DB entries) */
  needsMigration: boolean
  /** The old master_key (only set when needsMigration is true, for re-encrypting) */
  oldEntryKey?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function userKeyPath(email: string): string {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, "_")
  return `${USERS_ROOT}${safe}/${MASTER_KEY_FILE}`
}

async function readMasterKeyData(email: string): Promise<MasterKeyData | null> {
  const path = userKeyPath(email)
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) return null
  const raw = await FileSystem.readAsStringAsync(path)
  return JSON.parse(raw) as MasterKeyData
}

async function writeMasterKeyData(email: string, data: MasterKeyData): Promise<void> {
  const path = userKeyPath(email)
  const dir = path.substring(0, path.lastIndexOf("/") + 1)
  const dirInfo = await FileSystem.getInfoAsync(dir)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data))
}

/** Extract iteration count from PHC hash string */
function getPhcIterations(phcHash: string): number {
  const parts = phcHash.split("$")
  if (parts.length < 3) return 0
  return parseInt(parts[2].split("=")[1], 10) || 0
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function hasMasterKey(email: Email): Promise<boolean> {
  const path = userKeyPath(email)
  const info = await FileSystem.getInfoAsync(path)
  return info.exists
}

/**
 * Create a new master.key (v2 format) for a new user.
 * Generates a random vault_key, encrypts it with master_key.
 * Returns the vault_key (hex) for immediate use.
 */
export async function createMasterKey(
  email: Email,
  password: Password,
): Promise<string> {
  const { hash } = await hashMasterPassword(password)
  const encryption_salt = generateEncryptionSalt()
  const masterKey = await deriveEncryptionKey(password, encryption_salt)

  // Generate random 256-bit vault key
  const vaultKey = generateSharedVaultKey()

  // Encrypt vault_key with master_key
  const { encrypted_data, nonce } = encryptRaw(vaultKey, masterKey)

  const data: MasterKeyDataV2 = {
    hash,
    encryption_salt,
    encrypted_vault_key: encrypted_data,
    vault_key_nonce: nonce,
    version: 2,
  }

  await writeMasterKeyData(email, data)
  return vaultKey
}

/**
 * Verify password and return the key for entry encryption.
 *
 * v2: derives master_key -> decrypts vault_key -> returns vault_key
 * v1 (legacy): derives master_key -> returns it directly + signals migration needed
 *
 * Also re-hashes password with current iteration count if PHC uses < 600K.
 */
export async function verifyAndDeriveKey(
  email: Email,
  password: Password,
): Promise<UnlockResult | null> {
  const data = await readMasterKeyData(email)
  if (!data) return null

  if (!await verifyMasterPassword(password, data.hash)) return null

  const masterKey = await deriveEncryptionKey(password, data.encryption_salt)

  // Auto-upgrade: re-hash with current (600K) iterations if stored hash uses fewer
  const storedIterations = getPhcIterations(data.hash)
  if (storedIterations < 600_000) {
    const { hash: newHash } = await hashMasterPassword(password)
    data.hash = newHash
    await writeMasterKeyData(email, data)
  }

  if (data.version === 2) {
    const vaultKey = decryptRaw(data.encrypted_vault_key, data.vault_key_nonce, masterKey)
    return { vaultKey, needsMigration: false }
  }

  // v1 legacy: master_key was used directly for entries
  return { vaultKey: masterKey, needsMigration: true, oldEntryKey: masterKey }
}

/**
 * Migrate a v1 master.key to v2 format.
 * Generates a new vault_key, stores it encrypted with master_key.
 * Returns the new vault_key — caller must re-encrypt all DB entries.
 */
export async function migrateToV2(
  email: Email,
  password: Password,
): Promise<string> {
  const data = await readMasterKeyData(email)
  if (!data) throw new Error("No master.key found for migration")

  const masterKey = await deriveEncryptionKey(password, data.encryption_salt)
  const vaultKey = generateSharedVaultKey()
  const { encrypted_data, nonce } = encryptRaw(vaultKey, masterKey)

  const v2Data: MasterKeyDataV2 = {
    hash: data.hash,
    encryption_salt: data.encryption_salt,
    encrypted_vault_key: encrypted_data,
    vault_key_nonce: nonce,
    version: 2,
  }

  await writeMasterKeyData(email, v2Data)
  return vaultKey
}

/**
 * Change master password.
 * v2: re-hashes password, re-encrypts vault_key with new master_key.
 * The vault_key itself does NOT change — no need to re-encrypt entries.
 * Returns the vault_key on success, null if old password is wrong.
 */
export async function changeMasterPassword(
  email: Email,
  oldPassword: Password,
  newPassword: Password,
): Promise<string | null> {
  const data = await readMasterKeyData(email)
  if (!data) return null

  if (!await verifyMasterPassword(oldPassword, data.hash)) return null

  const oldMasterKey = await deriveEncryptionKey(oldPassword, data.encryption_salt)

  // Re-hash with new password (uses current 600K iterations)
  const { hash: newHash } = await hashMasterPassword(newPassword)
  const newMasterKey = await deriveEncryptionKey(newPassword, data.encryption_salt)

  if (data.version === 2) {
    // Decrypt vault_key with old master_key, re-encrypt with new
    const vaultKey = decryptRaw(data.encrypted_vault_key, data.vault_key_nonce, oldMasterKey)
    const { encrypted_data, nonce } = encryptRaw(vaultKey, newMasterKey)

    const updated: MasterKeyDataV2 = {
      ...data,
      hash: newHash,
      encrypted_vault_key: encrypted_data,
      vault_key_nonce: nonce,
    }
    await writeMasterKeyData(email, updated)
    return vaultKey
  }

  // v1 fallback (shouldn't happen if migration ran, but safe)
  const updated: MasterKeyDataV1 = { ...data, hash: newHash }
  await writeMasterKeyData(email, updated)
  return newMasterKey
}
