import { createContext, useContext, useState, type ReactNode } from "react"
import { useColorScheme } from "react-native"
import { darkColors, lightColors, type ColorPalette } from "./theme"

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
  const [override, setOverride] = useState<"light" | "dark" | null>(null)
  const colorScheme = override ?? (systemScheme === "light" ? "light" : "dark")
  const colors = colorScheme === "light" ? lightColors : darkColors

  const toggleTheme = () => {
    setOverride(colorScheme === "dark" ? "light" : "dark")
  }

  return (
    <ThemeContext.Provider value={{ colors, colorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
