import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { SessionState } from "./types"
import { CURRENT_USER } from "./types"

interface VaultContextType {
  currentUser: typeof CURRENT_USER
  sessionState: SessionState
  toggleSession: () => void
}

const VaultContext = createContext<VaultContextType | null>(null)

export function VaultProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("active")

  const toggleSession = useCallback(() => {
    setSessionState((prev) => (prev === "active" ? "locked" : "active"))
  }, [])

  return (
    <VaultContext.Provider
      value={{
        currentUser: CURRENT_USER,
        sessionState,
        toggleSession,
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
