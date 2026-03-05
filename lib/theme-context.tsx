import { createContext, useContext, type ReactNode } from "react"
import { useColorScheme } from "react-native"
import { darkColors, lightColors, type ColorPalette } from "./theme"

interface ThemeContextType {
  colors: ColorPalette
  colorScheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  colorScheme: "dark",
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme()
  const colorScheme = systemScheme === "light" ? "light" : "dark"
  const colors = colorScheme === "light" ? lightColors : darkColors

  return (
    <ThemeContext.Provider value={{ colors, colorScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
