import { useEffect, useRef } from "react"
import { AppState, type AppStateStatus } from "react-native"
import { useVault } from "./vault-context"
import { useSettings } from "./settings-context"

/**
 * Locks the vault when app returns from background after autoLockTimeout.
 * Timeout of 0 means "never auto-lock".
 */
export function useAutoLock() {
  const { sessionState, lock } = useVault()
  const { settings } = useSettings()
  const backgroundAt = useRef<number | null>(null)

  useEffect(() => {
    if (sessionState !== "active") return

    const handleChange = (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        backgroundAt.current = Date.now()
      } else if (next === "active" && backgroundAt.current !== null) {
        const timeout = settings.autoLockTimeout
        if (timeout > 0) {
          const elapsed = Date.now() - backgroundAt.current
          if (elapsed >= timeout * 60_000) {
            lock()
          }
        }
        backgroundAt.current = null
      }
    }

    const sub = AppState.addEventListener("change", handleChange)
    return () => sub.remove()
  }, [sessionState, settings.autoLockTimeout, lock])
}
