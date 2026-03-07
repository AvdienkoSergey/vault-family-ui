import { useState, useMemo, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { useVaultEntries } from "@/lib/use-vault-entries"
import type { VaultEntry, VaultType } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import { useSettings } from "@/lib/settings-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { VaultEntryCard } from "@/components/vault-entry-card"
import { EntryDetail } from "@/components/entry-detail"

type VaultTab = "all" | "personal" | "shared"

export default function VaultScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { sessionState } = useVault()
  const { settings } = useSettings()
  const {
    entries, counts, loading,
    addEntry, updateEntry, deleteEntry, toggleFavorite,
  } = useVaultEntries()
  const [search, setSearch] = useState("")
  const [vaultTab, setVaultTab] = useState<VaultTab>("all")
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const categories = settings.categories

  const handleSave = useCallback((updated: VaultEntry) => {
    updateEntry(updated)
    setSelectedEntry(updated)
  }, [updateEntry])

  const handleDelete = useCallback((id: string) => {
    deleteEntry(id)
    setSelectedEntry(null)
  }, [deleteEntry])

  if (selectedEntry) {
    return (
      <EntryDetail
        entry={selectedEntry}
        onBack={() => setSelectedEntry(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    )
  }

  if (sessionState === "locked") {
    return <LockedOverlay />
  }

  const sourceEntries =
    vaultTab === "all"
      ? entries
      : entries.filter((e) => e.vaultType === vaultTab)

  const filteredEntries = sourceEntries.filter((entry) => {
    if (filterCategory && entry.category !== filterCategory) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.login.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Vault</Text>
            <Text style={styles.headerSub}>
              {counts.total} entries across {counts.personal} personal,{" "}
              {counts.shared} shared
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
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
          {categories.length > 0 && (
            <Pressable
              style={[styles.filterBtn, filterCategory && styles.filterBtnActive]}
              onPress={() => setFilterCategory(filterCategory ? null : categories[0])}
            >
              <Ionicons
                name="funnel"
                size={16}
                color={filterCategory ? colors.primaryForeground : colors.mutedForeground}
              />
            </Pressable>
          )}
        </View>
        {filterCategory && categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
                style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
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
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : filteredEntries.length === 0 ? (
          <Pressable style={styles.emptyState} onPress={search ? undefined : () => setShowAddModal(true)}>
            <Ionicons
              name={search ? "search" : "add-circle-outline"}
              size={32}
              color={withOpacity(colors.mutedForeground, 0.4)}
            />
            <Text style={styles.emptyTitle}>
              {search ? "No entries found" : "Vault is empty"}
            </Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search term" : "Tap + to add your first entry"}
            </Text>
          </Pressable>
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

      {/* Add Entry Modal */}
      <AddEntryModal
        visible={showAddModal}
        colors={colors}
        categories={categories}
        onClose={() => setShowAddModal(false)}
        onAdd={(entry) => {
          addEntry(entry)
          setShowAddModal(false)
        }}
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Add Entry Modal
// ---------------------------------------------------------------------------

function AddEntryModal({
  visible,
  colors,
  categories,
  onClose,
  onAdd,
}: {
  visible: boolean
  colors: ColorPalette
  categories: string[]
  onClose: () => void
  onAdd: (entry: Omit<VaultEntry, "id">) => void
}) {
  const styles = useMemo(() => createStyles(colors), [colors])
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [category, setCategory] = useState(categories[0] ?? "")
  const [vaultType, setVaultType] = useState<VaultType>("personal")

  const reset = () => {
    setTitle(""); setUrl(""); setLogin(""); setPassword("")
    setCategory(categories[0] ?? ""); setVaultType("personal")
  }

  const handleSubmit = () => {
    if (!title.trim() || !login.trim() || !password.trim()) return
    onAdd({
      title: title.trim(),
      url: url.trim(),
      login: login.trim(),
      password,
      category,
      vaultType,
      favorite: false,
      lastModified: new Date().toISOString().split("T")[0],
    })
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Entry</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={styles.inputLabel}>TITLE *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Gmail, GitHub..."
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>URL</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://..."
              placeholderTextColor={colors.mutedForeground}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.inputLabel}>LOGIN *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="username or email"
              placeholderTextColor={colors.mutedForeground}
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>PASSWORD *</Text>
            <TextInput
              style={[styles.modalInput, { fontFamily: "monospace" }]}
              placeholder="password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {categories.length > 0 && (
              <Text style={styles.inputLabel}>CATEGORY</Text>
            )}
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>VAULT</Text>
            <View style={styles.vaultTypeRow}>
              {(["personal", "shared"] as VaultType[]).map((vt) => (
                <Pressable
                  key={vt}
                  onPress={() => setVaultType(vt)}
                  style={[
                    styles.vaultTypeBtn,
                    vaultType === vt && styles.vaultTypeBtnActive,
                  ]}
                >
                  <Ionicons
                    name={vt === "personal" ? "person" : "people"}
                    size={14}
                    color={vaultType === vt ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.vaultTypeBtnText,
                      vaultType === vt && styles.vaultTypeBtnTextActive,
                    ]}
                  >
                    {vt.charAt(0).toUpperCase() + vt.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            style={[
              styles.submitBtn,
              (!title.trim() || !login.trim() || !password.trim()) && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !login.trim() || !password.trim()}
          >
            <Ionicons name="shield-checkmark" size={16} color={colors.primaryForeground} />
            <Text style={styles.submitBtnText}>Encrypt & Save</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipsRow: {
    marginTop: 6,
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  filterChipTextActive: {
    color: colors.primaryForeground,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: withOpacity(colors.background, 0.85),
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  inputLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    height: 40,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  categoryChipTextActive: {
    color: colors.primaryForeground,
  },
  vaultTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  vaultTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  vaultTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vaultTypeBtnText: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  vaultTypeBtnTextActive: {
    color: colors.primaryForeground,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primaryForeground,
  },
})
