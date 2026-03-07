/**
 * vault-db — SQLite-based encrypted vault storage.
 *
 * Plaintext columns: id, category, vault_type, shared_vault_id, favorite, last_modified
 * Encrypted blob (AES-256-GCM): { title, url, login, password } → encrypted_data + nonce
 */
import * as SQLite from "expo-sqlite"
import * as Crypto from "expo-crypto"
import { encryptEntry, decryptEntry } from "./crypto-bridge"
import type { VaultEntry, VaultType } from "./types"

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let db: SQLite.SQLiteDatabase | null = null

function assertDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error("Vault DB is not open. Call openVaultDb first.")
  return db
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function openVaultDb(email: string): void {
  if (db) return
  const safeName = email.replace(/[^a-zA-Z0-9._-]/g, "_")
  db = SQLite.openDatabaseSync(`vault_${safeName}.db`)
  initSchema()
}

export function closeVaultDb(): void {
  if (!db) return
  db.closeSync()
  db = null
}

export function isVaultDbOpen(): boolean {
  return db !== null
}

// ---------------------------------------------------------------------------
// Schema & migrations
// ---------------------------------------------------------------------------

function initSchema(): void {
  const d = assertDb()

  d.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `)

  const row = d.getFirstSync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1",
  )
  const currentVersion = row?.version ?? 0

  if (currentVersion < 1) {
    d.execSync(`
      CREATE TABLE IF NOT EXISTS entries (
        id              TEXT PRIMARY KEY,
        category        TEXT NOT NULL,
        vault_type      TEXT NOT NULL CHECK(vault_type IN ('personal','shared')),
        shared_vault_id TEXT,
        favorite        INTEGER NOT NULL DEFAULT 0,
        last_modified   TEXT NOT NULL,
        encrypted_data  TEXT NOT NULL,
        nonce           TEXT NOT NULL
      );
    `)
    if (currentVersion === 0) {
      d.runSync("INSERT INTO schema_version (version) VALUES (?)", 1)
    } else {
      d.runSync("UPDATE schema_version SET version = ?", 1)
    }
  }

  // Future: if (currentVersion < 2) { ... }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface EntrySecrets {
  title: string
  url: string
  login: string
  password: string
}

function encryptSecrets(
  secrets: EntrySecrets,
  keyHex: string,
): { encrypted_data: string; nonce: string } {
  return encryptEntry(JSON.stringify(secrets), keyHex)
}

function decryptSecrets(
  encryptedData: string,
  nonce: string,
  keyHex: string,
): EntrySecrets {
  const json = decryptEntry(encryptedData, nonce, keyHex)
  return JSON.parse(json) as EntrySecrets
}

function rowToEntry(
  row: {
    id: string
    category: string
    vault_type: string
    shared_vault_id: string | null
    favorite: number
    last_modified: string
    encrypted_data: string
    nonce: string
  },
  keyHex: string,
): VaultEntry {
  const secrets = decryptSecrets(row.encrypted_data, row.nonce, keyHex)
  return {
    id: row.id,
    ...secrets,
    category: row.category,
    vaultType: row.vault_type as VaultType,
    ...(row.shared_vault_id ? { sharedVaultId: row.shared_vault_id } : {}),
    favorite: row.favorite === 1,
    lastModified: row.last_modified,
  }
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function addEntry(
  entry: Omit<VaultEntry, "id">,
  keyHex: string,
): VaultEntry {
  const d = assertDb()
  const id = Crypto.randomUUID()
  const { encrypted_data, nonce } = encryptSecrets(
    { title: entry.title, url: entry.url, login: entry.login, password: entry.password },
    keyHex,
  )

  d.runSync(
    `INSERT INTO entries (id, category, vault_type, shared_vault_id, favorite, last_modified, encrypted_data, nonce)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    entry.category,
    entry.vaultType,
    entry.sharedVaultId ?? null,
    entry.favorite ? 1 : 0,
    entry.lastModified,
    encrypted_data,
    nonce,
  )

  return { id, ...entry }
}

export function getAllDecryptedEntries(
  keyHex: string,
  vaultType?: VaultType,
): VaultEntry[] {
  const d = assertDb()
  const query = vaultType
    ? "SELECT * FROM entries WHERE vault_type = ? ORDER BY last_modified DESC"
    : "SELECT * FROM entries ORDER BY last_modified DESC"
  const args = vaultType ? [vaultType] : []

  const rows = d.getAllSync<{
    id: string; category: string; vault_type: string;
    shared_vault_id: string | null; favorite: number;
    last_modified: string; encrypted_data: string; nonce: string;
  }>(query, ...args)

  return rows.map((row) => rowToEntry(row, keyHex))
}

export function getDecryptedEntry(
  id: string,
  keyHex: string,
): VaultEntry | null {
  const d = assertDb()
  const row = d.getFirstSync<{
    id: string; category: string; vault_type: string;
    shared_vault_id: string | null; favorite: number;
    last_modified: string; encrypted_data: string; nonce: string;
  }>("SELECT * FROM entries WHERE id = ?", id)

  if (!row) return null
  return rowToEntry(row, keyHex)
}

export function updateEntry(entry: VaultEntry, keyHex: string): void {
  const d = assertDb()
  const { encrypted_data, nonce } = encryptSecrets(
    { title: entry.title, url: entry.url, login: entry.login, password: entry.password },
    keyHex,
  )

  d.runSync(
    `UPDATE entries SET category=?, vault_type=?, shared_vault_id=?, favorite=?,
     last_modified=?, encrypted_data=?, nonce=? WHERE id=?`,
    entry.category,
    entry.vaultType,
    entry.sharedVaultId ?? null,
    entry.favorite ? 1 : 0,
    entry.lastModified,
    encrypted_data,
    nonce,
    entry.id,
  )
}

export function deleteEntry(id: string): void {
  const d = assertDb()
  d.runSync("DELETE FROM entries WHERE id = ?", id)
}

export function toggleFavorite(id: string): void {
  const d = assertDb()
  d.runSync(
    "UPDATE entries SET favorite = CASE WHEN favorite=0 THEN 1 ELSE 0 END WHERE id = ?",
    id,
  )
}

export function getEntryCount(): { total: number; personal: number; shared: number } {
  const d = assertDb()
  const total = d.getFirstSync<{ c: number }>("SELECT COUNT(*) as c FROM entries")?.c ?? 0
  const personal = d.getFirstSync<{ c: number }>(
    "SELECT COUNT(*) as c FROM entries WHERE vault_type = 'personal'",
  )?.c ?? 0
  return { total, personal, shared: total - personal }
}

// ---------------------------------------------------------------------------
// Migration: re-encrypt all entries with a new key
// ---------------------------------------------------------------------------

export function reEncryptAllEntries(oldKeyHex: string, newKeyHex: string): void {
  const d = assertDb()
  const rows = d.getAllSync<{
    id: string; category: string; vault_type: string;
    shared_vault_id: string | null; favorite: number;
    last_modified: string; encrypted_data: string; nonce: string;
  }>("SELECT * FROM entries")

  for (const row of rows) {
    // Decrypt with old key
    const secrets = decryptSecrets(row.encrypted_data, row.nonce, oldKeyHex)
    // Re-encrypt with new key
    const { encrypted_data, nonce } = encryptSecrets(secrets, newKeyHex)
    d.runSync(
      "UPDATE entries SET encrypted_data=?, nonce=? WHERE id=?",
      encrypted_data, nonce, row.id,
    )
  }
}

// ---------------------------------------------------------------------------
// Seed (dev-only)
// ---------------------------------------------------------------------------

export function seedIfEmpty(keyHex: string): void {
  const { total } = getEntryCount()
  if (total > 0) return

  // Lazy-import to avoid bundling mock data in production
  const { personalEntries, sharedEntries } = require("./data")
  const all = [...personalEntries, ...sharedEntries] as VaultEntry[]
  for (const entry of all) {
    const { id: _id, ...rest } = entry
    addEntry(rest, keyHex)
  }
}
