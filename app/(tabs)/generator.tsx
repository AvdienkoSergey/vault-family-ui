import { useState, useCallback, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { copyToClipboard } from "@/lib/clipboard"

// TODO: replace Math.random with crypto.getRandomValues or WASM-based CSPRNG
function generatePassword(
  length: number,
  uppercase: boolean,
  lowercase: boolean,
  numbers: boolean,
  symbols: boolean
): string {
  let chars = ""
  if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz"
  if (numbers) chars += "0123456789"
  if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"
  if (chars === "") chars = "abcdefghijklmnopqrstuvwxyz"

  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

function getStrength(
  length: number,
  options: number,
  colors: ColorPalette
): { label: string; color: string; width: number } {
  const score = (length / 32) * 50 + options * 12.5
  if (score >= 75)
    return { label: "Very Strong", color: colors.success, width: 1 }
  if (score >= 50)
    return { label: "Strong", color: colors.primary, width: 0.75 }
  if (score >= 30)
    return { label: "Fair", color: colors.warning, width: 0.5 }
  return { label: "Weak", color: colors.destructive, width: 0.25 }
}

export default function GeneratorScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [length, setLength] = useState(20)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState(() =>
    generatePassword(20, true, true, true, true)
  )
  const [copied, setCopied] = useState(false)

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length, uppercase, lowercase, numbers, symbols))
    setCopied(false)
  }, [length, uppercase, lowercase, numbers, symbols])

  const handleCopy = () => {
    copyToClipboard(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const adjustLength = (delta: number) => {
    const newLen = Math.max(8, Math.min(64, length + delta))
    setLength(newLen)
    setPassword(generatePassword(newLen, uppercase, lowercase, numbers, symbols))
  }

  const optionCount = [uppercase, lowercase, numbers, symbols].filter(
    Boolean
  ).length
  const strength = getStrength(length, optionCount, colors)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Password Generator</Text>
        <Text style={styles.headerSub}>
          Generate cryptographically secure passwords
        </Text>
      </View>

      {/* Generated password */}
      <View style={styles.card}>
        <View style={styles.passwordBox}>
          <Text style={styles.passwordText} selectable>
            {password}
          </Text>
        </View>
        <View style={styles.passwordActions}>
          <Pressable
            style={[
              styles.copyBtn,
              copied && { backgroundColor: withOpacity(colors.success, 0.15) },
            ]}
            onPress={handleCopy}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={14}
              color={copied ? colors.success : colors.primaryForeground}
            />
            <Text
              style={[
                styles.copyBtnText,
                copied && { color: colors.success },
              ]}
            >
              {copied ? "Copied" : "Copy Password"}
            </Text>
          </Pressable>
          <Pressable style={styles.refreshBtn} onPress={regenerate}>
            <Ionicons name="refresh" size={16} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Strength */}
      <View style={styles.card}>
        <View style={styles.strengthHeader}>
          <Text style={styles.strengthLabel}>Password Strength</Text>
          <Text style={[styles.strengthValue, { color: strength.color }]}>
            {strength.label}
          </Text>
        </View>
        <View style={styles.strengthTrack}>
          <View
            style={[
              styles.strengthFill,
              {
                backgroundColor: strength.color,
                width: `${strength.width * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Options */}
      <View style={styles.card}>
        {/* Length */}
        <View style={styles.lengthSection}>
          <View style={styles.lengthHeader}>
            <Text style={styles.optionLabel}>Length</Text>
            <Text style={styles.lengthValue}>{length}</Text>
          </View>
          <View style={styles.sliderRow}>
            <Pressable
              onPress={() => adjustLength(-1)}
              style={styles.sliderBtn}
            >
              <Ionicons name="remove" size={16} color={colors.foreground} />
            </Pressable>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    width: `${((length - 8) / 56) * 100}%`,
                  },
                ]}
              />
            </View>
            <Pressable
              onPress={() => adjustLength(1)}
              style={styles.sliderBtn}
            >
              <Ionicons name="add" size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>8</Text>
            <Text style={styles.sliderLabel}>64</Text>
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.toggleList}>
          <ToggleOption
            label="Uppercase (A-Z)"
            checked={uppercase}
            onCheckedChange={(v) => {
              setUppercase(v)
              setPassword(
                generatePassword(length, v, lowercase, numbers, symbols)
              )
            }}
          />
          <ToggleOption
            label="Lowercase (a-z)"
            checked={lowercase}
            onCheckedChange={(v) => {
              setLowercase(v)
              setPassword(
                generatePassword(length, uppercase, v, numbers, symbols)
              )
            }}
          />
          <ToggleOption
            label="Numbers (0-9)"
            checked={numbers}
            onCheckedChange={(v) => {
              setNumbers(v)
              setPassword(
                generatePassword(length, uppercase, lowercase, v, symbols)
              )
            }}
          />
          <ToggleOption
            label="Symbols (!@#$)"
            checked={symbols}
            onCheckedChange={(v) => {
              setSymbols(v)
              setPassword(
                generatePassword(length, uppercase, lowercase, numbers, v)
              )
            }}
          />
        </View>
      </View>
    </ScrollView>
  )
}

function ToggleOption({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const { colors } = useTheme()

  return (
    <View style={toggleStyles.toggleRow}>
      <Text style={[toggleStyles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={checked}
        onValueChange={onCheckedChange}
        trackColor={{
          false: colors.secondary,
          true: withOpacity(colors.primary, 0.4),
        }}
        thumbColor={checked ? colors.primary : colors.mutedForeground}
      />
    </View>
  )
}

const toggleStyles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 12,
  },
})

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  headerSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  passwordBox: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  passwordText: {
    fontFamily: "monospace",
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 22,
  },
  passwordActions: {
    flexDirection: "row",
    gap: 8,
  },
  copyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primaryForeground,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  strengthTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 3,
  },
  lengthSection: {
    marginBottom: 20,
  },
  lengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.foreground,
  },
  lengthValue: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 44,
  },
  sliderLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  toggleList: {
    gap: 12,
  },
})
