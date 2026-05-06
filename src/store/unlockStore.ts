// ── unlockStore.ts ────────────────────────────────────────────────────────────
// Tracks which apps the player has unlocked / installed.
// OSShell reads this to decide which desktop icons to show.

import { create } from 'zustand'

interface UnlockState {
  installed: string[]
  install:   (id: string) => void
  has:       (id: string) => boolean
}

export const useUnlockStore = create<UnlockState>((set, get) => ({
  // Apps always available from the start (no unlock required)
  installed: ['browser', 'mail', 'jobs', 'appstore', 'terminal', 'files'],

  install: (id: string) =>
    set(s =>
      s.installed.includes(id)
        ? s
        : { installed: [...s.installed, id] }
    ),

  has: (id: string) => get().installed.includes(id),
}))
