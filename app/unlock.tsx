import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native"
import * as SplashScreen from "expo-splash-screen"
import { Ionicons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { useTheme } from "@/lib/theme-context"
import { useSettings } from "@/lib/settings-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { parseEmail, parsePassword } from "@/lib/types"
import { listUsers } from "@/lib/storage"
import { hasStoredCredentials, isBiometricsAvailable } from "@/lib/security-service"

type Mode = "loading" | "create" | "signin"

export default function UnlockScreen() {
  const { unlock, unlockWithBiometrics, pendingBiometricEnroll, completeBiometricEnroll } = useVault()
  const { colors } = useTheme()
  const { preloadForEmail } = useSettings()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [mode, setMode] = useState<Mode>("loading")
  const [knownUsers, setKnownUsers] = useState<string[]>([])
  const [hasBiometrics, setHasBiometrics] = useState(false)
  const [deviceHasBiometrics, setDeviceHasBiometrics] = useState(false)
  const [email, setEmail] = useState("")
  const lastSigninEmail = useRef("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([listUsers(), hasStoredCredentials(), isBiometricsAvailable()]).then(
      ([users, bioAvailable, deviceBio]) => {
        setKnownUsers(users)
        setHasBiometrics(bioAvailable)
        setDeviceHasBiometrics(deviceBio)
        if (users.length > 0) {
          setEmail(users[0])
          lastSigninEmail.current = users[0]
          preloadForEmail(users[0])
          setMode("signin")
        } else {
          setMode("create")
        }
      },
    )
  }, [])

  const isCreate = mode === "create"

  const handleSubmit = async () => {
    setError("")

    const emailResult = parseEmail(email)
    if (!emailResult.ok) {
      setError(emailResult.error)
      return
    }

    const passwordResult = parsePassword(password)
    if (!passwordResult.ok) {
      setError(passwordResult.error)
      return
    }

    if (isCreate && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setSubmitting(true)
    const result = await unlock(emailResult.value, passwordResult.value)
    setSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setPassword("")
    setConfirmPassword("")
  }

  const canSubmit = isCreate
    ? email.includes("@") && password.length >= 8 && confirmPassword.length > 0
    : email.includes("@") && password.length >= 1

  // Auto-dismiss biometric enrollment if device doesn't support biometrics
  useEffect(() => {
    if (pendingBiometricEnroll && !deviceHasBiometrics) {
      completeBiometricEnroll(false)
    }
  }, [pendingBiometricEnroll, deviceHasBiometrics])

  useEffect(() => {
    if (mode !== "loading") {
      SplashScreen.hideAsync()
    }
  }, [mode])

  if (mode === "loading") {
    return <View style={styles.container} />
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
            {isCreate ? "Create your vault" : "Welcome back"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            {mode === "signin" && knownUsers.length > 1 ? (
              <View style={styles.usersWrap}>
                {knownUsers.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      styles.userChip,
                      u === email && styles.userChipActive,
                    ]}
                    onPress={() => { setEmail(u); lastSigninEmail.current = u; preloadForEmail(u); setError("") }}
                  >
                    <Text
                      style={[
                        styles.userChipText,
                        u === email && styles.userChipTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            )}
          </View>

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

          {isCreate && (
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
            style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Ionicons
                  name={isCreate ? "add-circle" : "lock-open"}
                  size={16}
                  color={colors.primaryForeground}
                />
                <Text style={styles.submitText}>
                  {isCreate ? "Create Vault" : "Sign In"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Footer actions */}
        <View style={styles.footer}>
          {!isCreate && hasBiometrics && (
            <Pressable
              style={styles.footerBtn}
              onPress={async () => {
                setError("")
                const ok = await unlockWithBiometrics()
                if (!ok) setError("Biometric authentication failed")
              }}
            >
              <Ionicons name="finger-print" size={20} color={colors.primary} />
              <Text style={styles.footerBtnText}>Use Biometrics</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.footerBtn}
            onPress={() => {
              setMode(isCreate ? "signin" : "create")
              if (isCreate && knownUsers.length > 0) {
                const restore = lastSigninEmail.current || knownUsers[0]
                setEmail(restore)
                preloadForEmail(restore)
              } else {
                setEmail("")
              }
              setPassword("")
              setConfirmPassword("")
              setError("")
            }}
          >
            <Text style={styles.switchText}>
              {isCreate ? "Already have a vault? Sign in" : "Create new vault"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Biometric enrollment modal — only shown if device supports biometrics */}
      {pendingBiometricEnroll && deviceHasBiometrics && (
        <Modal
          transparent
          animationType="fade"
          visible
          onRequestClose={() => completeBiometricEnroll(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => {}}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="finger-print" size={36} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Enable Biometric Unlock?</Text>
              <Text style={styles.modalDesc}>
                Use your fingerprint or face to unlock the vault quickly next time.
              </Text>
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalBtnSecondary}
                  onPress={() => completeBiometricEnroll(false)}
                >
                  <Text style={styles.modalBtnSecondaryText}>Not Now</Text>
                </Pressable>
                <Pressable
                  style={styles.modalBtnPrimary}
                  onPress={() => completeBiometricEnroll(true)}
                >
                  <Ionicons name="finger-print" size={16} color={colors.primaryForeground} />
                  <Text style={styles.modalBtnPrimaryText}>Enable</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

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
    usersWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    userChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.md,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userChipActive: {
      backgroundColor: withOpacity(colors.primary, 0.15),
      borderColor: colors.primary,
    },
    userChipText: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    userChipTextActive: {
      color: colors.primary,
      fontWeight: "500",
    },
    footer: {
      alignItems: "center",
      gap: 12,
    },
    footerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 4,
    },
    footerBtnText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "500",
    },
    switchText: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      width: "100%",
      alignItems: "center",
      gap: 12,
    },
    modalIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: withOpacity(colors.primary, 0.15),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
    },
    modalDesc: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 18,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
      width: "100%",
    },
    modalBtnSecondary: {
      flex: 1,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalBtnSecondaryText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.foreground,
    },
    modalBtnPrimary: {
      flex: 1,
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
    },
    modalBtnPrimaryText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryForeground,
    },
  })
