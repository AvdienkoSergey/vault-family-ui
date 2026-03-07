import { useState, useMemo } from "react"
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { useVault } from "@/lib/vault-context"
import { sharedVaults, familyMembers, sharedEntries } from "@/lib/data"
import type { FamilyMember, SharedVault, VaultEntry } from "@/lib/types"
import { useTheme } from "@/lib/theme-context"
import { withOpacity, radius, type ColorPalette } from "@/lib/theme"
import { EntryDetail } from "@/components/entry-detail"

export default function FamilyScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { sessionState } = useVault()
  const [selectedVault, setSelectedVault] = useState<SharedVault | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [showNewVault, setShowNewVault] = useState(false)
  const [revokeAlert, setRevokeAlert] = useState<string | null>(null)

  if (sessionState === "locked") {
    return (
      <View style={styles.locked}>
        <View style={styles.lockedIcon}>
          <Ionicons name="people" size={40} color={colors.shared} />
        </View>
        <Text style={styles.lockedTitle}>Shared Vaults Locked</Text>
        <Text style={styles.lockedSub}>
          Unlock your session to access family shared vaults.
        </Text>
      </View>
    )
  }

  if (selectedVault) {
    return (
      <VaultDetail
        vault={selectedVault}
        onBack={() => setSelectedVault(null)}
        revokeAlert={revokeAlert}
        setRevokeAlert={setRevokeAlert}
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Family Vaults</Text>
          <Text style={styles.headerSub}>
            {sharedVaults.length} shared vaults, {familyMembers.length} members
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowNewVault(true)}
        >
          <Ionicons name="add" size={14} color={colors.primaryForeground} />
          <Text style={styles.addBtnText}>New Vault</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {/* Vault cards */}
        {sharedVaults.map((vault) => (
          <Pressable
            key={vault.id}
            onPress={() => setSelectedVault(vault)}
            style={({ pressed }) => [
              styles.vaultCard,
              pressed && styles.vaultCardPressed,
            ]}
          >
            <View style={styles.vaultIcon}>
              <Ionicons name="key" size={16} color={colors.shared} />
            </View>
            <View style={styles.vaultInfo}>
              <View style={styles.vaultTitleRow}>
                <Text style={styles.vaultName}>{vault.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {vault.entryCount} entries
                  </Text>
                </View>
              </View>
              <View style={styles.vaultMembers}>
                <View style={styles.avatarStack}>
                  {vault.members.slice(0, 3).map((m, i) => (
                    <View
                      key={m.id}
                      style={[
                        styles.miniAvatar,
                        i > 0 && { marginLeft: -6 },
                      ]}
                    >
                      <Text style={styles.miniAvatarText}>{m.avatar}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.memberCount}>
                  {vault.memberCount} members
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}

        {/* Manage Family */}
        <Text style={styles.sectionTitle}>Manage Family</Text>
        {familyMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onRevoke={() => setRevokeAlert(member.id)}
            showRevoke={revokeAlert === member.id}
            onDismissRevoke={() => setRevokeAlert(null)}
          />
        ))}

        <Pressable
          style={styles.inviteBtn}
          onPress={() => setShowInvite(true)}
        >
          <Ionicons name="add" size={14} color={colors.mutedForeground} />
          <Text style={styles.inviteBtnText}>Invite Family Member</Text>
        </Pressable>
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInvite} transparent animationType="slide">
        <InviteModal onClose={() => setShowInvite(false)} />
      </Modal>

      {/* New Vault Modal */}
      <Modal visible={showNewVault} transparent animationType="slide">
        <NewVaultModal onClose={() => setShowNewVault(false)} />
      </Modal>
    </View>
  )
}

function MemberCard({
  member,
  onRevoke,
  showRevoke,
  onDismissRevoke,
}: {
  member: FamilyMember
  onRevoke: () => void
  showRevoke: boolean
  onDismissRevoke: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const roleColor =
    member.role === "owner"
      ? colors.primary
      : member.role === "editor"
        ? colors.success
        : colors.warning

  return (
    <View style={styles.memberCard}>
      <View style={styles.memberRow}>
        <View
          style={[
            styles.memberAvatar,
            { backgroundColor: withOpacity(roleColor, 0.2) },
          ]}
        >
          <Text style={[styles.memberAvatarText, { color: roleColor }]}>
            {member.avatar}
          </Text>
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{member.name}</Text>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: withOpacity(roleColor, 0.15) },
              ]}
            >
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                {member.role === "owner"
                  ? "Owner"
                  : member.role === "editor"
                    ? "Editor"
                    : "Viewer"}
              </Text>
            </View>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    member.permission === "readwrite"
                      ? withOpacity(colors.primary, 0.1)
                      : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  {
                    color:
                      member.permission === "readwrite"
                        ? colors.primary
                        : colors.mutedForeground,
                  },
                ]}
              >
                {member.permission === "readwrite" ? "Read/Write" : "Read"}
              </Text>
            </View>
          </View>

          <View style={styles.cryptoRow}>
            {member.cryptoStatus === "synced" ? (
              <View style={styles.statusRow}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={12}
                  color={colors.success}
                />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Keys synced
                </Text>
              </View>
            ) : member.cryptoStatus === "pending" ? (
              <View style={styles.statusRow}>
                <Ionicons name="time" size={12} color={colors.warning} />
                <Text style={[styles.statusText, { color: colors.warning }]}>
                  Key exchange pending
                </Text>
              </View>
            ) : (
              <View style={styles.statusRow}>
                <MaterialCommunityIcons
                  name="shield-alert"
                  size={12}
                  color={colors.destructive}
                />
                <Text
                  style={[styles.statusText, { color: colors.destructive }]}
                >
                  Access revoked
                </Text>
              </View>
            )}
            <Text style={styles.lastActive}>{member.lastActive}</Text>
          </View>
        </View>

        {member.role !== "owner" && (
          <Pressable onPress={onRevoke} style={styles.revokeBtn}>
            <Ionicons
              name="person-remove"
              size={14}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
      </View>

      {showRevoke && (
        <View style={styles.revokeAlert}>
          <Text style={styles.revokeAlertText}>
            Revoking access will trigger a re-keying of all shared vaults.
          </Text>
          <View style={styles.revokeActions}>
            <Pressable
              style={styles.revokeConfirmBtn}
              onPress={() => {
                throw new Error("NOT_IMPLEMENTED: revoke member access, trigger re-keying of all shared vaults via CryptoBridge.deriveSharedKey")
              }}
            >
              <Text style={styles.revokeConfirmText}>Confirm Revoke</Text>
            </Pressable>
            <Pressable onPress={onDismissRevoke} style={styles.revokeCancelBtn}>
              <Text style={styles.revokeCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

function VaultDetail({
  vault,
  onBack,
  revokeAlert,
  setRevokeAlert,
}: {
  vault: SharedVault
  onBack: () => void
  revokeAlert: string | null
  setRevokeAlert: (id: string | null) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const entries = sharedEntries.filter((e) => e.sharedVaultId === vault.id)
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null)

  if (selectedEntry) {
    return (
      <EntryDetail
        entry={selectedEntry}
        onBack={() => setSelectedEntry(null)}
      />
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Ionicons
            name="chevron-back"
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={styles.backText}>Back to Family Vaults</Text>
        </Pressable>

        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.headerTitle}>{vault.name}</Text>
            <Text style={styles.headerSub}>
              {entries.length} entries, {vault.memberCount} members
            </Text>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              throw new Error("NOT_IMPLEMENTED: add entry to shared vault, encrypt via CryptoBridge with shared key")
            }}
          >
            <Ionicons
              name="add"
              size={14}
              color={colors.primaryForeground}
            />
            <Text style={styles.addBtnText}>Add Entry</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Entries</Text>
        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            style={({ pressed }) => [
              styles.entryCard,
              pressed && { borderColor: withOpacity(colors.shared, 0.4) },
            ]}
            onPress={() => setSelectedEntry(entry)}
          >
            <View style={styles.entryIcon}>
              <Text style={styles.entryIconText}>
                {entry.category.charAt(0)}
              </Text>
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryLogin} numberOfLines={1}>
                {entry.login}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{entry.category}</Text>
            </View>
          </Pressable>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Members</Text>
        {vault.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onRevoke={() => setRevokeAlert(member.id)}
            showRevoke={revokeAlert === member.id}
            onDismissRevoke={() => setRevokeAlert(null)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [permission, setPermission] = useState<"read" | "readwrite">("readwrite")

  return (
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={() => {}}>
        <Text style={styles.modalTitle}>Invite Family Member</Text>
        <Text style={styles.modalSub}>
          An X25519 key exchange will be initiated for secure vault sharing.
        </Text>
        <TextInput
          placeholder="Enter email or username"
          placeholderTextColor={colors.mutedForeground}
          style={styles.modalInput}
        />
        <View style={styles.permissionRow}>
          <Text style={styles.permissionLabel}>Permission:</Text>
          <Pressable
            onPress={() => setPermission("read")}
            style={[
              styles.permissionOption,
              permission === "read" && styles.permissionActive,
            ]}
          >
            <Text
              style={[
                styles.permissionText,
                permission === "read" && { color: colors.primary },
              ]}
            >
              Read
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPermission("readwrite")}
            style={[
              styles.permissionOption,
              permission === "readwrite" && styles.permissionActive,
            ]}
          >
            <Text
              style={[
                styles.permissionText,
                permission === "readwrite" && { color: colors.primary },
              ]}
            >
              Read/Write
            </Text>
          </Pressable>
        </View>
        <View style={styles.modalActions}>
          <Pressable
            style={styles.modalPrimaryBtn}
            onPress={() => {
              throw new Error("NOT_IMPLEMENTED: send invitation, initiate X25519 key exchange via CryptoBridge.deriveSharedKey")
            }}
          >
            <Text style={styles.modalPrimaryText}>Send Invitation</Text>
          </Pressable>
          <Pressable style={styles.modalSecondaryBtn} onPress={onClose}>
            <Text style={styles.modalSecondaryText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  )
}

function NewVaultModal({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalContent} onPress={() => {}}>
        <Text style={styles.modalTitle}>New Shared Vault</Text>
        <Text style={styles.modalSub}>
          Create a new vault to share credentials with family members.
        </Text>
        <TextInput
          placeholder="Vault name (e.g., Travel, School)"
          placeholderTextColor={colors.mutedForeground}
          style={styles.modalInput}
        />
        <View style={styles.modalActions}>
          <Pressable
            style={styles.modalPrimaryBtn}
            onPress={() => {
              throw new Error("NOT_IMPLEMENTED: create shared vault in shared.db, generate vault key via CryptoBridge")
            }}
          >
            <Text style={styles.modalPrimaryText}>Create Vault</Text>
          </Pressable>
          <Pressable style={styles.modalSecondaryBtn} onPress={onClose}>
            <Text style={styles.modalSecondaryText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  )
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  detailContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  vaultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vaultCardPressed: {
    borderColor: withOpacity(colors.shared, 0.4),
  },
  vaultIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: withOpacity(colors.shared, 0.15),
    alignItems: "center",
    justifyContent: "center",
  },
  vaultInfo: {
    flex: 1,
    minWidth: 0,
  },
  vaultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vaultName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: colors.secondaryForeground,
  },
  vaultMembers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: "row",
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.card,
  },
  miniAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.secondaryForeground,
  },
  memberCount: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.mutedForeground,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  memberCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  memberName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
  },
  cryptoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 10,
  },
  lastActive: {
    fontSize: 10,
    color: colors.mutedForeground,
  },
  revokeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  revokeAlert: {
    borderTopWidth: 1,
    borderTopColor: withOpacity(colors.destructive, 0.3),
    padding: 12,
    backgroundColor: withOpacity(colors.destructive, 0.12),
  },
  revokeAlertText: {
    fontSize: 12,
    color: colors.destructive,
    fontWeight: "500",
    marginBottom: 8,
  },
  revokeActions: {
    flexDirection: "row",
    gap: 8,
  },
  revokeConfirmBtn: {
    height: 28,
    paddingHorizontal: 12,
    backgroundColor: colors.destructive,
    borderRadius: radius.sm,
    justifyContent: "center",
  },
  revokeConfirmText: {
    fontSize: 12,
    color: colors.destructiveForeground,
  },
  revokeCancelBtn: {
    height: 28,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  revokeCancelText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  inviteBtnText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  backText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: withOpacity(colors.shared, 0.15),
    alignItems: "center",
    justifyContent: "center",
  },
  entryIconText: {
    fontSize: 14,
    color: colors.shared,
  },
  entryInfo: {
    flex: 1,
    minWidth: 0,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  entryLogin: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
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
    backgroundColor: withOpacity(colors.shared, 0.1),
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  modalInput: {
    height: 40,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  permissionLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  permissionOption: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
  },
  permissionActive: {
    backgroundColor: withOpacity(colors.primary, 0.2),
  },
  permissionText: {
    fontSize: 12,
    color: colors.secondaryForeground,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primaryForeground,
  },
  modalSecondaryBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    fontSize: 12,
    color: colors.foreground,
  },
})
