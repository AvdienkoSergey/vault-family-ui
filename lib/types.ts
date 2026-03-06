// ---------------------------------------------------------------------------
// Branded types
// ---------------------------------------------------------------------------

declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type Email = Brand<string, "Email">
export type Password = Brand<string, "Password">

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_MAX_LENGTH = 128

export function parseEmail(raw: string): ValidationResult<Email> {
  const trimmed = raw.trim().toLowerCase()
  if (trimmed.length === 0) return { ok: false, error: "Email is required" }
  if (trimmed.length > 254) return { ok: false, error: "Email is too long" }
  if (!EMAIL_RE.test(trimmed)) return { ok: false, error: "Invalid email format" }
  const [local, domain] = trimmed.split("@")
  if (local.length > 64) return { ok: false, error: "Email local part is too long" }
  if (!domain.includes(".")) return { ok: false, error: "Email domain must contain a dot" }
  return { ok: true, value: trimmed as Email }
}

export function parsePassword(raw: string): ValidationResult<Password> {
  if (raw.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }
  }
  if (raw.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` }
  }
  if (!/[a-z]/.test(raw)) return { ok: false, error: "Password must contain a lowercase letter" }
  if (!/[A-Z]/.test(raw)) return { ok: false, error: "Password must contain an uppercase letter" }
  if (!/[0-9]/.test(raw)) return { ok: false, error: "Password must contain a digit" }
  return { ok: true, value: raw as Password }
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type Role = "owner" | "editor" | "viewer"
export type Permission = "read" | "readwrite"
export type VaultType = "personal" | "shared"
export type SessionState = "locked" | "active"

export interface VaultEntry {
  id: string
  title: string
  url: string
  login: string
  password: string
  category: string
  vaultType: VaultType
  sharedVaultId?: string
  lastModified: string
  favorite: boolean
}

export interface FamilyMember {
  id: string
  name: string
  role: Role
  permission: Permission
  avatar: string
  cryptoStatus: "synced" | "pending" | "revoked"
  publicKey: string
  lastActive: string
}

export interface SharedVault {
  id: string
  name: string
  memberCount: number
  entryCount: number
  members: FamilyMember[]
  createdBy: string
}

export interface UserProfile {
  id: string
  name: string
  role: Role
  avatar: string
}

export const CURRENT_USER: UserProfile = {
  id: "u1",
  name: "James",
  role: "owner",
  avatar: "J",
}
