import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { LogBox } from "react-native"
import { VaultProvider } from "@/lib/vault-context"
import { ThemeProvider, useTheme } from "@/lib/theme-context"

LogBox.ignoreLogs(["props.pointerEvents is deprecated"])

function AppStack() {
  const { colors, colorScheme } = useTheme()

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <VaultProvider>
      <ThemeProvider>
        <AppStack />
      </ThemeProvider>
    </VaultProvider>
  )
}
