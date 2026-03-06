import { useMemo } from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, type ColorPalette } from "@/lib/theme"

export function SessionBar() {
  const insets = useSafeAreaInsets()
  const { sessionState, lock, currentUser } = useVault()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isActive = sessionState === "active"
  if (!currentUser) return null

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        <Ionicons name="shield" size={16} color={colors.primary} />
        <Text style={styles.title}>Vault Family</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.user}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser.avatar}</Text>
          </View>
          <Text style={styles.userName}>{currentUser.name}</Text>
        </View>

        <Pressable
          onPress={lock}
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActive
                ? withOpacity(colors.success, 0.15)
                : withOpacity(colors.destructive, 0.15),
            },
          ]}
        >
          <Ionicons
            name={isActive ? "lock-open" : "lock-closed"}
            size={12}
            color={isActive ? colors.success : colors.destructive}
          />
          <Text
            style={[
              styles.statusText,
              { color: isActive ? colors.success : colors.destructive },
            ]}
          >
            {isActive ? "Active" : "Locked"}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: withOpacity(colors.primary, 0.2),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
  userName: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
})
