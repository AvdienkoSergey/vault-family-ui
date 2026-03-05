import { useState, useMemo } from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { VaultEntry } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { copyToClipboard } from "@/lib/clipboard"

interface VaultEntryCardProps {
  entry: VaultEntry
  onSelect: (entry: VaultEntry) => void
}

export function VaultEntryCard({ entry, onSelect }: VaultEntryCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isShared = entry.vaultType === "shared"

  const handleCopy = (text: string, field: string) => {
    copyToClipboard(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  return (
    <Pressable
      onPress={() => onSelect(entry)}
      style={({ pressed }) => [
        styles.card,
        isShared && styles.sharedBorder,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: isShared
              ? withOpacity(colors.shared, 0.15)
              : withOpacity(colors.primary, 0.15),
          },
        ]}
      >
        <Text
          style={[
            styles.iconText,
            { color: isShared ? colors.shared : colors.primary },
          ]}
        >
          {getCategoryIcon(entry.category)}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
          {entry.favorite && (
            <Ionicons name="star" size={12} color={colors.warning} />
          )}
          {isShared && (
            <View style={styles.sharedBadge}>
              <Text style={styles.sharedBadgeText}>Shared</Text>
            </View>
          )}
        </View>
        <Text style={styles.login} numberOfLines={1}>
          {entry.login}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => handleCopy(entry.login, "login")}
          style={[
            styles.copyBtn,
            copiedField === "login" && {
              backgroundColor: withOpacity(colors.success, 0.2),
            },
          ]}
        >
          <Ionicons
            name="copy-outline"
            size={14}
            color={
              copiedField === "login"
                ? colors.success
                : colors.mutedForeground
            }
          />
        </Pressable>
        <Pressable
          onPress={() => handleCopy(entry.password, "password")}
          style={[
            styles.copyBtn,
            copiedField === "password" && {
              backgroundColor: withOpacity(colors.success, 0.2),
            },
          ]}
        >
          <Text
            style={[
              styles.copyPassText,
              copiedField === "password" && { color: colors.success },
            ]}
          >
            ***
          </Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case "Email":
      return "@"
    case "Development":
      return "</>"
    case "Cloud":
      return "\u2601"
    case "Social":
      return "\u21D7"
    case "Finance":
      return "$"
    case "Entertainment":
      return "\u25B6"
    case "Network":
      return "\u2601"
    case "Shopping":
      return "~"
    default:
      return "\u2601"
  }
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sharedBorder: {
    borderLeftWidth: 2,
    borderLeftColor: colors.shared,
  },
  cardPressed: {
    borderColor: withOpacity(colors.primary, 0.4),
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    flexShrink: 1,
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
  login: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  copyPassText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
})
