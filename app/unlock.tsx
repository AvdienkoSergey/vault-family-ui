import { useState, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"

export default function UnlockScreen() {
  const { unlock } = useVault()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isFirstRun] = useState(true) // TODO: detect from storage
  const [error, setError] = useState("")

  const canSubmit = isFirstRun
    ? name.trim().length > 0 && password.length >= 6 && password === confirmPassword
    : password.length >= 1

  const handleSubmit = () => {
    setError("")
    if (isFirstRun && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (isFirstRun && password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    unlock(name.trim() || "User", password)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={styles.logoTitle}>Vault Family</Text>
          <Text style={styles.logoSub}>
            {isFirstRun ? "Create your vault" : "Welcome back"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {isFirstRun && (
            <View style={styles.field}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Master Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter master password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          {isFirstRun && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm master password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Ionicons
              name={isFirstRun ? "add-circle" : "lock-open"}
              size={16}
              color={colors.primaryForeground}
            />
            <Text style={styles.submitText}>
              {isFirstRun ? "Create Vault" : "Unlock"}
            </Text>
          </Pressable>
        </View>

        {!isFirstRun && (
          <Pressable style={styles.biometricBtn}>
            <Ionicons name="finger-print" size={20} color={colors.primary} />
            <Text style={styles.biometricText}>Use Biometrics</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 24,
    },
    logoWrap: {
      alignItems: "center",
      gap: 8,
    },
    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: withOpacity(colors.primary, 0.15),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    logoTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
    },
    logoSub: {
      fontSize: 13,
      color: colors.mutedForeground,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      gap: 16,
    },
    field: {
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.mutedForeground,
    },
    input: {
      height: 44,
      backgroundColor: colors.input,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.input,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    passwordInput: {
      flex: 1,
      height: 44,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.foreground,
    },
    eyeBtn: {
      padding: 10,
    },
    error: {
      fontSize: 12,
      color: colors.destructive,
      textAlign: "center",
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 46,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      marginTop: 4,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryForeground,
    },
    biometricBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
    },
    biometricText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "500",
    },
  })
