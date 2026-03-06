import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { SessionState, UserProfile, Email, Password } from "./types"

interface VaultContextType {
  currentUser: UserProfile | null
  sessionState: SessionState
  unlock: (email: Email, password: Password) => void
  lock: () => void
}

const VaultContext = createContext<VaultContextType | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("locked")
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

  const unlock = useCallback((email: Email, _password: Password) => {
    // TODO: validate password via WasmBridge / derive keys
    const name = email.split("@")[0]
    setCurrentUser({
      id: "u1",
      name,
      role: "owner",
      avatar: name.charAt(0).toUpperCase(),
    })
    setSessionState("active")
  }, [])

  const lock = useCallback(() => {
    setCurrentUser(null)
    setSessionState("locked")
  }, [])

  return (
    <VaultContext.Provider
      value={{
        currentUser,
        sessionState,
        unlock,
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
