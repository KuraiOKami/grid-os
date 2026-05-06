// ── unlockStore.ts ───────────────────────────────────────────────────────────
// Global named unlock flags shared across all apps.
// WatchApp sets flags (e.g. 'lena_arc_protected', 'null54_escalated').
// GridBrowser reads them to gate access to hidden pages.

import { create } from 'zustand'

interface UnlockStore {
  flags: Set<string>
  unlock: (key: string) => void
  has: (key: string) => boolean
}

export const useUnlockStore = create<UnlockStore>((set, get) => ({
  flags: new Set(),
  unlock: (key) => set(state => ({ flags: new Set([...state.flags, key]) })),
  has: (key) => get().flags.has(key),
}))
