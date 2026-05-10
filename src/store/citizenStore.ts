// ── citizenStore.ts ───────────────────────────────────────────────────────────
// Holds the player's citizen profile — handle, assigned ID, registration time.
// Persisted to localStorage independently of save slots.

import { create } from 'zustand'

export interface CitizenProfile {
  handle:       string
  citizenId:    string   // e.g. "4471"
  registeredAt: number
}

interface CitizenState {
  profile: CitizenProfile | null
  register: (handle: string) => CitizenProfile
  load:     () => void
  clear:    () => void
}

const LS_KEY = 'gridos_citizen'

function generateCitizenId(): string {
  return String(Math.floor(1000 + Math.random() * 8999))
}

export const useCitizenStore = create<CitizenState>((set) => ({
  profile: null,

  register: (handle) => {
    const profile: CitizenProfile = {
      handle,
      citizenId:    generateCitizenId(),
      registeredAt: Date.now(),
    }
    localStorage.setItem(LS_KEY, JSON.stringify(profile))
    set({ profile })
    return profile
  },

  load: () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) set({ profile: JSON.parse(raw) })
    } catch {}
  },

  clear: () => {
    localStorage.removeItem(LS_KEY)
    set({ profile: null })
  },
}))

export function isRegistered(): boolean {
  return !!localStorage.getItem('gridos_citizen')
}
