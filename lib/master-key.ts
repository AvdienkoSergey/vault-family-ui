/**
 * Master key management — stores password hash + encryption salt per user.
 * Uses WASM crypto module (PBKDF2 600K iterations, PHC format).
 */
import * as FileSystem from "expo-file-system"
import type { Email, Password } from "./types"
import {
  hashMasterPassword,
  verifyMasterPassword,
  deriveEncryptionKey,
  generateEncryptionSalt,
} from "./wasm-bridge"

const USERS_ROOT = `${FileSystem.documentDirectory}users/`
const MASTER_KEY_FILE = "master.key"

export interface MasterKeyData {
  /** PHC-format hash string (contains salt inside) */
  hash: string
  /** Separate salt for encryption key derivation (hex) */
  encryption_salt: string
  version: 1
}

function userKeyPath(email: string): string {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, "_")
  return `${USERS_ROOT}${safe}/${MASTER_KEY_FILE}`
}

/**
 * Check whether a master.key file exists for the given email.
 */
export async function hasMasterKey(email: Email): Promise<boolean> {
  const path = userKeyPath(email)
  const info = await FileSystem.getInfoAsync(path)
  return info.exists
}

/**
 * Create and persist a new master.key for the given email.
 * Returns the derived encryption key (hex) for immediate use.
 */
export async function createMasterKey(
  email: Email,
  password: Password,
): Promise<string> {
  const { hash } = hashMasterPassword(password)
  const encryption_salt = generateEncryptionSalt()
  const encryptionKey = deriveEncryptionKey(password, encryption_salt)

  const data: MasterKeyData = { hash, encryption_salt, version: 1 }

  const path = userKeyPath(email)
  const dir = path.substring(0, path.lastIndexOf("/") + 1)
  const dirInfo = await FileSystem.getInfoAsync(dir)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  }

  await FileSystem.writeAsStringAsync(path, JSON.stringify(data))
  return encryptionKey
}

/**
 * Verify password and derive encryption key.
 * Returns the encryption key (hex) on success, null on wrong password.
 */
export async function verifyAndDeriveKey(
  email: Email,
  password: Password,
): Promise<string | null> {
  const path = userKeyPath(email)
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) return null

  const raw = await FileSystem.readAsStringAsync(path)
  const data = JSON.parse(raw) as MasterKeyData

  if (!verifyMasterPassword(password, data.hash)) return null

  return deriveEncryptionKey(password, data.encryption_salt)
}

/**
 * Change master password: verify old, re-hash with new, re-derive encryption key.
 * The encryption_salt stays the same so existing encrypted entries remain accessible.
 * Returns the new encryption key on success, null if old password is wrong.
 */
export async function changeMasterPassword(
  email: Email,
  oldPassword: Password,
  newPassword: Password,
): Promise<string | null> {
  const path = userKeyPath(email)
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) return null

  const raw = await FileSystem.readAsStringAsync(path)
  const data = JSON.parse(raw) as MasterKeyData

  if (!verifyMasterPassword(oldPassword, data.hash)) return null

  // Re-hash with new password, keep the same encryption_salt
  const { hash: newHash } = hashMasterPassword(newPassword)
  const newKey = deriveEncryptionKey(newPassword, data.encryption_salt)

  const updated: MasterKeyData = { ...data, hash: newHash }
  await FileSystem.writeAsStringAsync(path, JSON.stringify(updated))

  return newKey
}
