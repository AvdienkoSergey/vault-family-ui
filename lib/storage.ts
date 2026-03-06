import * as FileSystem from "expo-file-system"
import type { Email } from "./types"

const USERS_ROOT = `${FileSystem.documentDirectory}users/`

/**
 * Returns the root directory for a given user, based on their email.
 * Creates the directory if it doesn't exist.
 */
export async function ensureUserDir(email: Email): Promise<string> {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, "_")
  const dir = `${USERS_ROOT}${safe}/`

  const info = await FileSystem.getInfoAsync(dir)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
  }

  return dir
}

/**
 * Returns list of registered user emails (directory names inside users/).
 * Empty array means first launch — no vaults created yet.
 */
export async function listUsers(): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(USERS_ROOT)
  if (!info.exists) return []

  const entries = await FileSystem.readDirectoryAsync(USERS_ROOT)
  return entries.filter((name) => name.includes("@"))
}

export interface VaultFileInfo {
  name: string
  size: number
  isDirectory: boolean
  modificationTime: number
}

/**
 * Lists all files and folders inside the given user directory
 * with their sizes and modification times.
 */
export async function listUserFiles(userDir: string): Promise<VaultFileInfo[]> {
  const info = await FileSystem.getInfoAsync(userDir)
  if (!info.exists) return []

  const names = await FileSystem.readDirectoryAsync(userDir)
  const results: VaultFileInfo[] = []

  for (const name of names) {
    const fileInfo = await FileSystem.getInfoAsync(`${userDir}${name}`, { size: true })
    if (fileInfo.exists) {
      results.push({
        name,
        size: fileInfo.size ?? 0,
        isDirectory: fileInfo.isDirectory ?? false,
        modificationTime: fileInfo.modificationTime ?? 0,
      })
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name))
}
