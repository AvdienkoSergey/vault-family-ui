import React, { useMemo, useState, useEffect, useCallback } from "react"
import { View, Text, ScrollView, Pressable, Switch, StyleSheet, ActivityIndicator, Modal } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { useTheme } from "@/lib/theme-context"
import { useSettings } from "@/lib/settings-context"
import { listUserFiles, deleteUserDir, type VaultFileInfo } from "@/lib/storage"
import { clearCredentials } from "@/lib/security-service"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name: string, isDirectory: boolean): keyof typeof MaterialCommunityIcons.glyphMap {
  if (isDirectory) return "folder-outline"
  if (name.endsWith(".db")) return "database"
  if (name.endsWith(".json")) return "code-json"
  if (name.endsWith(".key") || name.endsWith(".pem")) return "key-variant"
  return "file-outline"
}

export default function SettingsScreen() {
  const { currentUser, userDir, lock } = useVault()
  const { colors, colorScheme, toggleTheme } = useTheme()
  const { settings, update } = useSettings()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [files, setFiles] = useState<VaultFileInfo[]>([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const refreshFiles = useCallback(async () => {
    if (!userDir) return
    setFilesLoading(true)
    const list = await listUserFiles(userDir)
    setFiles(list)
    setFilesLoading(false)
  }, [userDir])

  useEffect(() => {
    refreshFiles()
  }, [refreshFiles])

  if (!currentUser) return null

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
          <View style={{ flex: 1 }}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </View>
            </View>
            <Text style={styles.profileSub}>Vault Family Owner</Text>
          </View>
          <View style={styles.profileActions}>
            <Pressable
              style={styles.profileActionBtnDanger}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons name="trash" size={14} color={colors.destructive} />
            </Pressable>
            <Pressable
              style={styles.profileActionBtn}
              onPress={() => {
                lock()
              }}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
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
          checked={settings.biometricEnabled}
          onToggle={(v) => {
            update("biometricEnabled", v)
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
          checked={settings.zeroizeOnClose}
          onToggle={(v) => {
            update("zeroizeOnClose", v)
          }}
        />
        <View style={styles.divider} />
        <SettingRow
          colors={colors}
          styles={styles}
          icon={
            <Ionicons
              name={colorScheme === "dark" ? "moon" : "sunny"}
              size={16}
              color={colors.mutedForeground}
            />
          }
          label="Dark Theme"
          toggle
          checked={colorScheme === "dark"}
          onToggle={toggleTheme}
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
      <View style={styles.storageTitleRow}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <Pressable onPress={refreshFiles} hitSlop={8}>
          <Ionicons name="refresh" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <View style={styles.card}>
        {filesLoading ? (
          <View style={styles.filesLoading}>
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          </View>
        ) : files.length === 0 ? (
          <View style={styles.filesEmpty}>
            <Ionicons name="folder-open-outline" size={20} color={colors.mutedForeground} />
            <Text style={styles.filesEmptyText}>Directory is empty</Text>
          </View>
        ) : (
          files.map((file, i) => (
            <View key={file.name}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.fileRow}>
                <View style={styles.settingIcon}>
                  <MaterialCommunityIcons
                    name={fileIcon(file.name, file.isDirectory)}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingLabel}>{file.name}</Text>
                  <Text style={styles.settingDesc}>
                    {file.isDirectory ? "directory" : formatBytes(file.size)}
                  </Text>
                </View>
                <View style={styles.systemBadge}>
                  <Text style={styles.systemValue}>
                    {file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
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

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={28} color={colors.destructive} />
            </View>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDesc}>
              This will permanently delete your vault directory and all stored data. This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalDeleteBtn}
                onPress={async () => {
                  try {
                    if (userDir) await deleteUserDir(userDir)
                    await clearCredentials()
                  } finally {
                    setShowDeleteModal(false)
                    lock()
                  }
                }}
              >
                <Ionicons name="trash" size={14} color="#fff" />
                <Text style={styles.modalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  profileActions: {
    flexDirection: "row",
    gap: 8,
  },
  profileActionBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  profileActionBtnDanger: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: withOpacity(colors.destructive, 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  storageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 8,
  },
  filesLoading: {
    padding: 24,
    alignItems: "center",
  },
  filesEmpty: {
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  filesEmptyText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: withOpacity(colors.destructive, 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  modalDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.foreground,
  },
  modalDeleteBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.destructive,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalDeleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
})
