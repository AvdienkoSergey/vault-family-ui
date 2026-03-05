import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { LogBox } from "react-native"
import * as SplashScreen from "expo-splash-screen"
import React, { useEffect } from "react"
import { VaultProvider } from "@/lib/vault-context"
import { ThemeProvider, useTheme } from "@/lib/theme-context"

// Keep splash visible until app signals it's ready
SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs(["props.pointerEvents is deprecated"])

function AppStack() {
  const { colors, colorScheme } = useTheme()

  useEffect(() => {
    // Hide splash once theme + providers are mounted — no black gap
    SplashScreen.hideAsync()
  }, [])

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
