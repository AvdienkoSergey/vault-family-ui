import { Stack, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { LogBox } from "react-native"
import * as SplashScreen from "expo-splash-screen"
import React, { useEffect } from "react"
import { VaultProvider, useVault } from "@/lib/vault-context"
import { SettingsProvider } from "@/lib/settings-context"
import { ThemeProvider, useTheme } from "@/lib/theme-context"

// Keep splash visible until app signals it's ready
SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs(["props.pointerEvents is deprecated"])

function AppStack() {
  const { colors, colorScheme } = useTheme()
  const { sessionState } = useVault()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    const inTabs = segments[0] === "(tabs)"
    if (sessionState === "locked" && inTabs) {
      router.replace("/unlock")
    } else if (sessionState === "active" && !inTabs) {
      router.replace("/(tabs)")
    }
  }, [sessionState])

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
        }}
      >
        <Stack.Screen name="unlock" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <VaultProvider>
      <SettingsProvider>
        <ThemeProvider>
          <AppStack />
        </ThemeProvider>
      </SettingsProvider>
    </VaultProvider>
  )
}
