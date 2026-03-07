import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import type { SessionState, UserProfile, Email, Password } from "./types"
import { parseEmail, parsePassword } from "./types"
import { ensureUserDir } from "./storage"
import { storeCredentials, retrieveCredentials, hasStoredCredentials } from "./security-service"
import { hasMasterKey, createMasterKey, verifyAndDeriveKey, changeMasterPassword as changeMasterPw } from "./master-key"
import { initWasm } from "./wasm-bridge"

interface VaultContextType {
  currentUser: UserProfile | null
  currentEmail: Email | null
  userDir: string | null
  sessionState: SessionState
  encryptionKey: string | null
  pendingBiometricEnroll: boolean
  unlock: (email: Email, password: Password) => Promise<{ error?: string }>
  unlockWithBiometrics: () => Promise<boolean>
  lock: () => void
  completeBiometricEnroll: (accepted: boolean) => void
  changePassword: (oldPassword: Password, newPassword: Password) => Promise<{ error?: string }>
}

const VaultContext = createContext<VaultContextType | null>(null)

async function activateSession(
  email: Email,
  setCurrentUser: (u: UserProfile) => void,
  setCurrentEmail: (e: Email) => void,
  setUserDir: (d: string) => void,
  setSessionState: (s: SessionState) => void,
) {
  const dir = await ensureUserDir(email)
  const name = email.split("@")[0]
  setCurrentUser({
    id: "u1",
    name,
    role: "owner",
    avatar: name.charAt(0).toUpperCase(),
  })
  setCurrentEmail(email)
  setUserDir(dir)
  setSessionState("active")
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("locked")
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [userDir, setUserDir] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null)
  const [pendingBiometricEnroll, setPendingBiometricEnroll] = useState(false)
  const pendingCredsRef = useRef<{ email: Email; password: Password } | null>(null)

  const unlock = useCallback(async (email: Email, password: Password): Promise<{ error?: string }> => {
    // Ensure WASM is loaded before any crypto operation
    await initWasm()

    const exists = await hasMasterKey(email)
    if (exists) {
      const key = await verifyAndDeriveKey(email, password)
      if (!key) return { error: "Incorrect master password" }
      setEncryptionKey(key)
    } else {
      const key = await createMasterKey(email, password)
      setEncryptionKey(key)
    }

    await activateSession(email, setCurrentUser, setCurrentEmail, setUserDir, setSessionState)

    // Only offer biometric enrollment if not already enrolled
    const alreadyEnrolled = await hasStoredCredentials()
    if (!alreadyEnrolled) {
      pendingCredsRef.current = { email, password }
      setPendingBiometricEnroll(true)
    } else {
      // Update stored credentials with the current password
      storeCredentials(email, password).catch(() => {})
    }
    return {}
  }, [])

  const completeBiometricEnroll = useCallback((accepted: boolean) => {
    if (accepted && pendingCredsRef.current) {
      const { email, password } = pendingCredsRef.current
      storeCredentials(email, password).catch(() => {})
    }
    pendingCredsRef.current = null
    setPendingBiometricEnroll(false)
  }, [])

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const creds = await retrieveCredentials()
    if (!creds) return false

    const emailResult = parseEmail(creds.email)
    const passwordResult = parsePassword(creds.password)
    if (!emailResult.ok || !passwordResult.ok) return false

    // Ensure WASM is loaded, then verify + derive key
    await initWasm()
    const key = await verifyAndDeriveKey(emailResult.value, passwordResult.value)
    if (!key) return false

    setEncryptionKey(key)
    await activateSession(emailResult.value, setCurrentUser, setCurrentEmail, setUserDir, setSessionState)
    return true
  }, [])

  const changePassword = useCallback(async (oldPassword: Password, newPassword: Password): Promise<{ error?: string }> => {
    if (!currentEmail) return { error: "No active session" }
    const newKey = await changeMasterPw(currentEmail, oldPassword, newPassword)
    if (!newKey) return { error: "Current password is incorrect" }
    setEncryptionKey(newKey)
    storeCredentials(currentEmail, newPassword).catch(() => {})
    return {}
  }, [currentEmail])

  const lock = useCallback(() => {
    setCurrentUser(null)
    setCurrentEmail(null)
    setUserDir(null)
    setEncryptionKey(null)
    setSessionState("locked")
  }, [])

  return (
    <VaultContext.Provider
      value={{
        currentUser,
        currentEmail,
        userDir,
        sessionState,
        encryptionKey,
        pendingBiometricEnroll,
        unlock,
        unlockWithBiometrics,
        lock,
        completeBiometricEnroll,
        changePassword,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (!context) throw new Error("useVault must be used within VaultProvider")
  return context
}
