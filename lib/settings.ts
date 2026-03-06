import * as FileSystem from "expo-file-system"
import type { Email } from "./types"

export type ThemeSetting = "light" | "dark" | "system"

export interface AppSettings {
  theme: ThemeSetting
  biometricEnabled: boolean
  zeroizeOnClose: boolean
  autoLockTimeout: number // minutes
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  biometricEnabled: true,
  zeroizeOnClose: true,
  autoLockTimeout: 5,
}

const USERS_ROOT = `${FileSystem.documentDirectory}users/`
const SETTINGS_FILE = "settings.json"

function settingsPath(userDir: string): string {
  return `${userDir}${SETTINGS_FILE}`
}

export async function loadSettings(userDir: string): Promise<AppSettings> {
  const path = settingsPath(userDir)
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) return { ...DEFAULT_SETTINGS }

  const raw = await FileSystem.readAsStringAsync(path)
  const parsed = JSON.parse(raw) as Partial<AppSettings>
  return { ...DEFAULT_SETTINGS, ...parsed }
}

/**
 * Load settings by email — no unlock required.
 * Reads directly from the user's directory if it exists.
 */
export async function loadSettingsByEmail(email: string): Promise<AppSettings> {
  const safe = email.replace(/[^a-zA-Z0-9@._-]/g, "_")
  const dir = `${USERS_ROOT}${safe}/`
  return loadSettings(dir)
}

export async function saveSettings(
  userDir: string,
  settings: AppSettings,
): Promise<void> {
  const path = settingsPath(userDir)
  await FileSystem.writeAsStringAsync(path, JSON.stringify(settings, null, 2))
}
