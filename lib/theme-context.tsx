import { createContext, useContext, useCallback, type ReactNode } from "react"
import { useColorScheme } from "react-native"
import { darkColors, lightColors, type ColorPalette } from "./theme"
import { useSettings } from "./settings-context"

interface ThemeContextType {
  colors: ColorPalette
  colorScheme: "light" | "dark"
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  colorScheme: "dark",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const { settings, update } = useSettings()

  const resolvedScheme: "light" | "dark" =
    settings.theme === "system"
      ? (systemScheme === "light" ? "light" : "dark")
      : settings.theme

  const colors = resolvedScheme === "light" ? lightColors : darkColors

  const toggleTheme = useCallback(() => {
    update("theme", resolvedScheme === "dark" ? "light" : "dark")
  }, [resolvedScheme, update])

  return (
    <ThemeContext.Provider value={{ colors, colorScheme: resolvedScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
