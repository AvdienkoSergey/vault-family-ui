import { useState, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { personalEntries, sharedEntries } from "@/lib/data"
import type { VaultEntry } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { VaultEntryCard } from "@/components/vault-entry-card"
import { EntryDetail } from "@/components/entry-detail"

type VaultTab = "all" | "personal" | "shared"

export default function VaultScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { sessionState } = useVault()
  const [search, setSearch] = useState("")
  const [vaultTab, setVaultTab] = useState<VaultTab>("all")
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null)

  if (selectedEntry) {
    return (
      <EntryDetail
        entry={selectedEntry}
        onBack={() => setSelectedEntry(null)}
      />
    )
  }

  if (sessionState === "locked") {
    return <LockedOverlay />
  }

  const allEntries = [...personalEntries, ...sharedEntries]
  const sourceEntries =
    vaultTab === "all"
      ? allEntries
      : vaultTab === "personal"
        ? personalEntries
        : sharedEntries

  const filteredEntries = sourceEntries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(search.toLowerCase()) ||
      entry.login.toLowerCase().includes(search.toLowerCase()) ||
      entry.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Vault</Text>
            <Text style={styles.headerSub}>
              {allEntries.length} entries across {personalEntries.length}{" "}
              personal, {sharedEntries.length} shared
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              throw new Error("NOT_IMPLEMENTED: navigate to Add Entry screen (encrypt via CryptoBridge before saving)")
            }}
          >
            <Ionicons name="add" size={14} color={colors.primaryForeground} />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color={colors.mutedForeground}
            />
            <TextInput
              placeholder="Search vault entries..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            style={styles.filterBtn}
            onPress={() => {
              throw new Error("NOT_IMPLEMENTED: open filter/sort options (by category, date, favorites)")
            }}
          >
            <Ionicons
              name="options"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <View style={styles.tabList}>
          {(["all", "personal", "shared"] as VaultTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setVaultTab(tab)}
              style={[styles.tab, vaultTab === tab && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  vaultTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Entry list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search"
              size={32}
              color={withOpacity(colors.mutedForeground, 0.4)}
            />
            <Text style={styles.emptyTitle}>No entries found</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <VaultEntryCard
              key={entry.id}
              entry={entry}
              onSelect={setSelectedEntry}
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

function LockedOverlay() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.locked}>
      <View style={styles.lockedIcon}>
        <Ionicons name="lock-closed" size={40} color={colors.primary} />
      </View>
      <Text style={styles.lockedTitle}>Vault Locked</Text>
      <Text style={styles.lockedSub}>
        Your session has ended. Tap the lock icon to unlock with your VaultPass.
      </Text>
      <Text style={styles.lockedHint}>All decrypted data has been zeroized</Text>
    </View>
  )
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primaryForeground,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    padding: 0,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabList: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    padding: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: radius.sm - 2,
  },
  tabActive: {
    backgroundColor: colors.card,
  },
  tabText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.foreground,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: withOpacity(colors.mutedForeground, 0.6),
    marginTop: 4,
  },
  locked: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  lockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: withOpacity(colors.primary, 0.1),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 8,
  },
  lockedSub: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 280,
  },
  lockedHint: {
    fontSize: 12,
    color: withOpacity(colors.mutedForeground, 0.6),
    fontFamily: "monospace",
    marginTop: 16,
  },
})
