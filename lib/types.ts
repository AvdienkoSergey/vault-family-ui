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
