/**
 * Archive service — encrypted backup/restore of the user vault.
 *
 * Export: user files → JSON manifest → AES-256-GCM encrypted blob
 * Import: encrypted blob → decrypt → restore files to user directory
 *
 * Double encryption in archive:
 *   1. Outer layer — entire bundle encrypted with archive key (PBKDF2 from master password)
 *   2. Inner layer — entries inside vault_*.db encrypted with vault key (as always)
 */

import * as FileSystem from "expo-file-system"

import {
  deriveEncryptionKey,
  encryptRaw,
  decryptRaw,
  generateEncryptionSalt,
} from "./crypto-bridge"
import { ensureUserDir, listUserFiles } from "./storage"
import type { Email } from "./types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArchiveFileEntry {
  name: string
  data_base64: string
}

interface ArchiveManifest {
  version: 1
  email: string
  created_at: string
  files: ArchiveFileEntry[]
}

export interface ArchiveBlob {
  encrypted_data: string
  nonce: string
  salt: string
  version: 1
}

export type ExportResult =
  | { ok: true; archive: ArchiveBlob; fileCount: number }
  | { ok: false; error: string }

export type ImportResult =
  | { ok: true; email: string; filesRestored: number }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const ARCHIVE_MAGIC = "VFARCHIVE1:"

const ALLOWED_NAMES = new Set(["master.key", "settings.json"])
const VAULT_DB_RE = /^vault_[a-zA-Z0-9@._-]+\.db$/

function isAllowedFilename(name: string): boolean {
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return false
  return ALLOWED_NAMES.has(name) || VAULT_DB_RE.test(name)
}

function utf8ToHex(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let hex = ""
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0")
  }
  return hex
}

function hexToUtf8(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return new TextDecoder().decode(bytes)
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportArchive(
  email: Email,
  password: string,
): Promise<ExportResult> {
  try {
    const userDir = await ensureUserDir(email)
    const allFiles = await listUserFiles(userDir)
    const vaultFiles = allFiles.filter((f) => !f.isDirectory && isAllowedFilename(f.name))

    if (vaultFiles.length === 0) {
      return { ok: false, error: "NO_FILES" }
    }

    const files: ArchiveFileEntry[] = []
    for (const f of vaultFiles) {
      const data = await FileSystem.readAsStringAsync(`${userDir}${f.name}`, {
        encoding: FileSystem.EncodingType.Base64,
      })
      files.push({ name: f.name, data_base64: data })
    }

    const manifest: ArchiveManifest = {
      version: 1,
      email,
      created_at: new Date().toISOString(),
      files,
    }

    const manifestHex = utf8ToHex(JSON.stringify(manifest))
    const salt = generateEncryptionSalt()
    const archiveKey = await deriveEncryptionKey(password, salt)
    const { encrypted_data, nonce } = encryptRaw(manifestHex, archiveKey)

    return {
      ok: true,
      archive: { encrypted_data, nonce, salt, version: 1 },
      fileCount: files.length,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ENCRYPTION_FAILED" }
  }
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export async function importArchive(
  archive: ArchiveBlob,
  password: string,
): Promise<ImportResult> {
  if (archive.version !== 1 || !archive.encrypted_data || !archive.nonce || !archive.salt) {
    return { ok: false, error: "INVALID_ARCHIVE" }
  }

  let manifestJson: string
  try {
    const archiveKey = await deriveEncryptionKey(password, archive.salt)
    const manifestHex = decryptRaw(archive.encrypted_data, archive.nonce, archiveKey)
    manifestJson = hexToUtf8(manifestHex)
  } catch {
    return { ok: false, error: "WRONG_PASSWORD" }
  }

  let manifest: ArchiveManifest
  try {
    manifest = JSON.parse(manifestJson)
  } catch {
    return { ok: false, error: "INVALID_ARCHIVE" }
  }

  if (manifest.version !== 1 || !manifest.email || !Array.isArray(manifest.files)) {
    return { ok: false, error: "INVALID_ARCHIVE" }
  }

  for (const f of manifest.files) {
    if (!isAllowedFilename(f.name)) {
      return { ok: false, error: `INVALID_FILENAME: ${f.name}` }
    }
  }

  try {
    const userDir = await ensureUserDir(manifest.email as Email)

    for (const f of manifest.files) {
      await FileSystem.writeAsStringAsync(`${userDir}${f.name}`, f.data_base64, {
        encoding: FileSystem.EncodingType.Base64,
      })
    }

    return { ok: true, email: manifest.email, filesRestored: manifest.files.length }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "IO_ERROR" }
  }
}

// ---------------------------------------------------------------------------
// Serialization (for file/network transport)
// ---------------------------------------------------------------------------

export function serializeArchive(archive: ArchiveBlob): string {
  return ARCHIVE_MAGIC + JSON.stringify(archive)
}

export function deserializeArchive(data: string): ArchiveBlob | null {
  if (!data.startsWith(ARCHIVE_MAGIC)) return null
  try {
    const parsed = JSON.parse(data.substring(ARCHIVE_MAGIC.length))
    if (parsed.version !== 1 || !parsed.encrypted_data || !parsed.nonce || !parsed.salt) {
      return null
    }
    return parsed as ArchiveBlob
  } catch {
    return null
  }
}
