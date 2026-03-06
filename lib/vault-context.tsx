import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { SessionState, UserProfile } from "./types"

interface VaultContextType {
  currentUser: UserProfile | null
  sessionState: SessionState
  unlock: (name: string, password: string) => void
  lock: () => void
}

const VaultContext = createContext<VaultContextType | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("locked")
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)

  const unlock = useCallback((name: string, _password: string) => {
    // TODO: validate password via WasmBridge / derive keys
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
