import { useState, useMemo } from "react"
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { VaultEntry } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { copyToClipboard } from "@/lib/clipboard"

interface EntryDetailProps {
  entry: VaultEntry
  onBack: () => void
}

export function EntryDetail({ entry, onBack }: EntryDetailProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isShared = entry.vaultType === "shared"

  const handleCopy = (text: string, field: string) => {
    copyToClipboard(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button */}
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Ionicons name="close" size={14} color={colors.mutedForeground} />
        <Text style={styles.backText}>Close</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: isShared
                ? withOpacity(colors.shared, 0.15)
                : withOpacity(colors.primary, 0.15),
            },
          ]}
        >
          <Text
            style={[
              styles.headerIconText,
              { color: isShared ? colors.shared : colors.primary },
            ]}
          >
            {entry.category.charAt(0)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>{entry.title}</Text>
            {isShared && (
              <View style={styles.sharedBadge}>
                <Text style={styles.sharedBadgeText}>Shared</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSub}>
            {entry.category} / Last modified {entry.lastModified}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => setIsEditing(!isEditing)}
          style={[styles.actionBtn, isEditing && styles.actionBtnActive]}
        >
          <Ionicons
            name={isEditing ? "checkmark" : "create-outline"}
            size={14}
            color={isEditing ? colors.successForeground : colors.success}
          />
          <Text
            style={[
              styles.actionBtnText,
              isEditing && { color: colors.successForeground },
            ]}
          >
            {isEditing ? "Save" : "Edit"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.deleteBtn}
          onPress={() => {
            throw new Error("NOT_IMPLEMENTED: confirm deletion and remove entry from vault.db via WasmBridge")
          }}
        >
          <Ionicons name="trash-outline" size={14} color={colors.destructive} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </Pressable>
      </View>

      {/* Fields card */}
      <View style={styles.fieldsCard}>
        <FieldRow
          colors={colors}
          styles={styles}
          label="Title"
          value={entry.title}
          editing={isEditing}
          onCopy={() => handleCopy(entry.title, "title")}
          copied={copiedField === "title"}
        />
        <View style={styles.divider} />
        <FieldRow
          colors={colors}
          styles={styles}
          label="URL"
          value={entry.url}
          editing={isEditing}
          onCopy={() => handleCopy(entry.url, "url")}
          copied={copiedField === "url"}
          isUrl
        />
        <View style={styles.divider} />
        <FieldRow
          colors={colors}
          styles={styles}
          label="Login"
          value={entry.login}
          editing={isEditing}
          onCopy={() => handleCopy(entry.login, "login")}
          copied={copiedField === "login"}
        />
        <View style={styles.divider} />

        {/* Password field */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            {isEditing ? (
              <TextInput
                defaultValue={entry.password}
                style={[styles.fieldInput, { fontFamily: "monospace" }]}
                placeholderTextColor={colors.mutedForeground}
              />
            ) : (
              <View style={styles.fieldValueWrap}>
                <Text style={styles.fieldValueMono}>
                  {showPassword ? entry.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.fieldActions}>
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.fieldActionBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={14}
                color={colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              onPress={() => handleCopy(entry.password, "password")}
              style={[
                styles.fieldActionBtn,
                copiedField === "password" && {
                  backgroundColor: withOpacity(colors.success, 0.2),
                },
              ]}
            >
              <Ionicons
                name={copiedField === "password" ? "checkmark" : "copy-outline"}
                size={14}
                color={
                  copiedField === "password"
                    ? colors.success
                    : colors.mutedForeground
                }
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Zeroize hint */}
      <View style={styles.zeroizeHint}>
        <Ionicons name="shield-outline" size={14} color={colors.warning} />
        <Text style={styles.zeroizeText}>
          Decrypted fields will be zeroized from memory when you close this view.
        </Text>
      </View>
    </ScrollView>
  )
}

function FieldRow({
  colors,
  styles,
  label,
  value,
  editing,
  onCopy,
  copied,
  isUrl,
}: {
  colors: ColorPalette
  styles: ReturnType<typeof createStyles>
  label: string
  value: string
  editing: boolean
  onCopy: () => void
  copied: boolean
  isUrl?: boolean
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
        {editing ? (
          <TextInput
            defaultValue={value}
            style={styles.fieldInput}
            placeholderTextColor={colors.mutedForeground}
          />
        ) : (
          <View style={styles.fieldValueRow}>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {value}
            </Text>
            {isUrl && (
              <Ionicons name="open-outline" size={12} color={colors.primary} />
            )}
          </View>
        )}
      </View>
      <Pressable
        onPress={onCopy}
        style={[
          styles.fieldActionBtn,
          copied && { backgroundColor: withOpacity(colors.success, 0.2) },
        ]}
      >
        <Ionicons
          name={copied ? "checkmark" : "copy-outline"}
          size={14}
          color={copied ? colors.success : colors.mutedForeground}
        />
      </Pressable>
    </View>
  )
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 24,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  backText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  sharedBadge: {
    backgroundColor: withOpacity(colors.shared, 0.15),
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  sharedBadgeText: {
    fontSize: 10,
    color: colors.shared,
  },
  headerSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: withOpacity(colors.success, 0.5),
    backgroundColor: withOpacity(colors.success, 0.15),
  },
  actionBtnActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.success,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: withOpacity(colors.destructive, 0.2),
  },
  deleteBtnText: {
    fontSize: 12,
    color: colors.destructive,
  },
  fieldsCard: {
    marginHorizontal: 16,
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
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  fieldContent: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 1,
    marginBottom: 4,
  },
  fieldInput: {
    height: 36,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
  },
  fieldValueWrap: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.foreground,
    flexShrink: 1,
  },
  fieldValueMono: {
    fontSize: 14,
    color: colors.foreground,
    fontFamily: "monospace",
  },
  fieldValueRow: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  fieldActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  fieldActionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  zeroizeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: withOpacity(colors.warning, 0.12),
    borderWidth: 1,
    borderColor: withOpacity(colors.warning, 0.25),
  },
  zeroizeText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: "500",
    flex: 1,
  },
})
