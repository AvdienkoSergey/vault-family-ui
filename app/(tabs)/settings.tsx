import { useState, useMemo } from "react"
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"

export default function SettingsScreen() {
  const { currentUser } = useVault()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [biometricEnabled, setBiometricEnabled] = useState(true)
  const [zeroizeEnabled, setZeroizeEnabled] = useState(true)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Security and vault configuration</Text>
      </View>

      {/* Profile */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{currentUser.avatar}</Text>
          </View>
          <View>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            </View>
            <Text style={styles.profileSub}>Vault Family Owner</Text>
          </View>
        </View>
      </View>

      {/* Security */}
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <SettingRow
          colors={colors}
          styles={styles}
          icon={<Ionicons name="time" size={16} color={colors.mutedForeground} />}
          label="Auto-lock Timeout"
          value="5 minutes"
          onPress={() => {
            throw new Error("NOT_IMPLEMENTED: show auto-lock timeout picker (1min, 5min, 15min, 30min, never)")
          }}
        />
        <View style={styles.divider} />
        <SettingRow
          colors={colors}
          styles={styles}
          icon={
            <Ionicons
              name="finger-print"
              size={16}
              color={colors.mutedForeground}
            />
          }
          label="Biometric Unlock"
          toggle
          checked={biometricEnabled}
          onToggle={(v) => {
            setBiometricEnabled(v)
          }}
        />
        <View style={styles.divider} />
        <SettingRow
          colors={colors}
          styles={styles}
          icon={
            <Ionicons name="shield" size={16} color={colors.mutedForeground} />
          }
          label="Zeroize on Close"
          description="Clear decrypted data from memory when app closes"
          toggle
          checked={zeroizeEnabled}
          onToggle={(v) => {
            setZeroizeEnabled(v)
          }}
        />
        <View style={styles.divider} />
        <SettingRow
          colors={colors}
          styles={styles}
          icon={<Ionicons name="key" size={16} color={colors.mutedForeground} />}
          label="Change Master Password"
          chevron
          onPress={() => {
            throw new Error("NOT_IMPLEMENTED: navigate to Change Master Password flow (verify current, enter new, re-derive keys via WasmBridge)")
          }}
        />
      </View>

      {/* Storage */}
      <Text style={styles.sectionTitle}>Storage</Text>
      <View style={styles.card}>
        <SettingRow
          colors={colors}
          styles={styles}
          icon={
            <MaterialCommunityIcons
              name="database"
              size={16}
              color={colors.mutedForeground}
            />
          }
          label="Personal Vault"
          value="vault.db"
          description="SQLCipher encrypted database"
        />
        <View style={styles.divider} />
        <SettingRow
          colors={colors}
          styles={styles}
          icon={
            <MaterialCommunityIcons
              name="harddisk"
              size={16}
              color={colors.mutedForeground}
            />
          }
          label="Shared Vault"
          value="shared.db"
          description="Encrypted with shared vault keys"
        />
      </View>

      {/* System */}
      <Text style={styles.sectionTitle}>System</Text>
      <View style={styles.card}>
        <SystemRow styles={styles} label="Backend" value="Rust / Axum" />
        <View style={styles.divider} />
        <SystemRow styles={styles} label="Encryption" value="XChaCha20-Poly1305" />
        <View style={styles.divider} />
        <SystemRow styles={styles} label="Key Exchange" value="X25519" />
        <View style={styles.divider} />
        <SystemRow styles={styles} label="KDF" value="Argon2id" />
      </View>

      {/* Sign out */}
      <Pressable
        style={styles.signOutBtn}
        onPress={() => {
          throw new Error("NOT_IMPLEMENTED: lock session, zeroize memory via WasmBridge, clear master key via SecurityService")
        }}
      >
        <Ionicons name="log-out" size={14} color={colors.destructive} />
        <Text style={styles.signOutText}>Lock and Sign Out</Text>
      </Pressable>
    </ScrollView>
  )
}

function SettingRow({
  colors,
  styles,
  icon,
  label,
  value,
  description,
  toggle,
  checked,
  onToggle,
  chevron,
  onPress,
}: {
  colors: ColorPalette
  styles: ReturnType<typeof createStyles>
  icon: React.ReactNode
  label: string
  value?: string
  description?: string
  toggle?: boolean
  checked?: boolean
  onToggle?: (value: boolean) => void
  chevron?: boolean
  onPress?: () => void
}) {
  const content = (
    <>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDesc}>{description}</Text>
        )}
      </View>
      {toggle && (
        <Switch
          value={checked}
          onValueChange={onToggle}
          trackColor={{
            false: colors.secondary,
            true: withOpacity(colors.primary, 0.4),
          }}
          thumbColor={checked ? colors.primary : colors.mutedForeground}
        />
      )}
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {chevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.mutedForeground}
        />
      )}
    </>
  )

  if (onPress || chevron) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.settingRow,
          pressed && { backgroundColor: withOpacity(colors.primary, 0.05) },
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    )
  }

  return <View style={styles.settingRow}>{content}</View>
}

function SystemRow({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>
  label: string
  value: string
}) {
  return (
    <View style={styles.systemRow}>
      <Text style={styles.systemLabel}>{label}</Text>
      <View style={styles.systemBadge}>
        <Text style={styles.systemValue}>{value}</Text>
      </View>
    </View>
  )
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 8,
  },
  header: {
    marginBottom: 8,
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedForeground,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: withOpacity(colors.primary, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  ownerBadge: {
    backgroundColor: withOpacity(colors.primary, 0.15),
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    color: colors.primary,
  },
  profileSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    minWidth: 0,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.foreground,
  },
  settingDesc: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: "monospace",
  },
  systemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  systemLabel: {
    fontSize: 12,
    color: colors.foreground,
  },
  systemBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemValue: {
    fontSize: 10,
    fontFamily: "monospace",
    color: colors.secondaryForeground,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withOpacity(colors.destructive, 0.2),
    marginTop: 8,
  },
  signOutText: {
    fontSize: 12,
    color: colors.destructive,
  },
})
