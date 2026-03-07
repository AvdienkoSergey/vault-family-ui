import { useState, useCallback, useEffect, useMemo } from "react"
import { useVault } from "./vault-context"
import * as VaultDb from "./vault-db"
import type { VaultEntry, VaultType } from "./types"

interface UseVaultEntriesReturn {
  entries: VaultEntry[]
  loading: boolean
  error: string | null
  counts: { total: number; personal: number; shared: number }
  refresh: () => void
  addEntry: (entry: Omit<VaultEntry, "id">) => VaultEntry | null
  updateEntry: (entry: VaultEntry) => void
  deleteEntry: (id: string) => void
  toggleFavorite: (id: string) => void
}

export function useVaultEntries(): UseVaultEntriesReturn {
  const { encryptionKey, sessionState } = useVault()
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (!encryptionKey || !VaultDb.isVaultDbOpen()) {
      setEntries([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const all = VaultDb.getAllDecryptedEntries(encryptionKey)
      setEntries(all)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entries")
    } finally {
      setLoading(false)
    }
  }, [encryptionKey])

  useEffect(() => {
    if (sessionState !== "active") {
      setEntries([])
      setLoading(false)
      return
    }
    refresh()
  }, [sessionState, refresh])

  const counts = useMemo(() => ({
    total: entries.length,
    personal: entries.filter((e) => e.vaultType === "personal").length,
    shared: entries.filter((e) => e.vaultType === "shared").length,
  }), [entries])

  const add = useCallback((entry: Omit<VaultEntry, "id">): VaultEntry | null => {
    if (!encryptionKey) return null
    try {
      const created = VaultDb.addEntry(entry, encryptionKey)
      refresh()
      return created
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add entry")
      return null
    }
  }, [encryptionKey, refresh])

  const update = useCallback((entry: VaultEntry): void => {
    if (!encryptionKey) return
    try {
      VaultDb.updateEntry(entry, encryptionKey)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update entry")
    }
  }, [encryptionKey, refresh])

  const remove = useCallback((id: string): void => {
    try {
      VaultDb.deleteEntry(id)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete entry")
    }
  }, [refresh])

  const toggle = useCallback((id: string): void => {
    try {
      VaultDb.toggleFavorite(id)
      refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to toggle favorite")
    }
  }, [refresh])

  return {
    entries,
    loading,
    error,
    counts,
    refresh,
    addEntry: add,
    updateEntry: update,
    deleteEntry: remove,
    toggleFavorite: toggle,
  }
}
