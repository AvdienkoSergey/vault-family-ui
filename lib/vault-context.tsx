import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { SessionState, UserProfile, Email, Password } from "./types"
import { parseEmail, parsePassword } from "./types"
import { ensureUserDir } from "./storage"
import { storeCredentials, retrieveCredentials, clearCredentials } from "./security-service"

interface VaultContextType {
  currentUser: UserProfile | null
  userDir: string | null
  sessionState: SessionState
  unlock: (email: Email, password: Password) => Promise<void>
  unlockWithBiometrics: () => Promise<boolean>
  lock: () => void
}

const VaultContext = createContext<VaultContextType | null>(null)

async function activateSession(
  email: Email,
  setCurrentUser: (u: UserProfile) => void,
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
  setUserDir(dir)
  setSessionState("active")
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("locked")
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [userDir, setUserDir] = useState<string | null>(null)

  const unlock = useCallback(async (email: Email, password: Password) => {
    // TODO: validate password via WasmBridge / derive keys
    await activateSession(email, setCurrentUser, setUserDir, setSessionState)
    // Save credentials for future biometric unlock
    storeCredentials(email, password).catch(() => {})
  }, [])

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    const creds = await retrieveCredentials()
    if (!creds) return false

    const emailResult = parseEmail(creds.email)
    const passwordResult = parsePassword(creds.password)
    if (!emailResult.ok || !passwordResult.ok) return false

    await activateSession(emailResult.value, setCurrentUser, setUserDir, setSessionState)
    return true
  }, [])

  const lock = useCallback(() => {
    setCurrentUser(null)
    setUserDir(null)
    setSessionState("locked")
  }, [])

  return (
    <VaultContext.Provider
      value={{
        currentUser,
        userDir,
        sessionState,
        unlock,
        unlockWithBiometrics,
        lock,
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
