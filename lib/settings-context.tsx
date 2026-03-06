import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { useVault } from "./vault-context"
import {
  loadSettings,
  loadSettingsByEmail,
  saveSettings,
  DEFAULT_SETTINGS,
  type AppSettings,
} from "./settings"

interface SettingsContextType {
  settings: AppSettings
  ready: boolean
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  preloadForEmail: (email: string) => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  ready: false,
  update: () => {},
  preloadForEmail: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { userDir } = useVault()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const userDirRef = useRef(userDir)
  userDirRef.current = userDir

  // Load full settings once userDir is available (after unlock)
  useEffect(() => {
    if (!userDir) return

    let cancelled = false
    loadSettings(userDir).then((loaded) => {
      if (!cancelled) {
        setSettings(loaded)
        setReady(true)
      }
    })
    return () => { cancelled = true }
  }, [userDir])

  // Reset ready flag when session is locked, but keep settings
  // so theme doesn't flash back to default
  useEffect(() => {
    if (!userDir) setReady(false)
  }, [userDir])

  // Preload settings by email (before unlock, on the login screen)
  const preloadForEmail = useCallback((email: string) => {
    loadSettingsByEmail(email).then(setSettings)
  }, [])

  const update = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        const dir = userDirRef.current
        if (dir) {
          saveSettings(dir, next).catch(() => {})
        }
        return next
      })
    },
    [],
  )

  return (
    <SettingsContext.Provider value={{ settings, ready, update, preloadForEmail }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
