// ── mapStore.ts ───────────────────────────────────────────────────────────────
// Tracks the player's physical location, travel state, and which locations
// have been scanned. Sniff progress is kept in component state (transient).

import { create } from 'zustand'

interface MapState {
  currentLocationId: string
  travelTargetId:    string | null
  travelStartedAt:   number | null
  travelDurationMs:  number
  scanned:           string[]       // location IDs scanned at least once

  startTravel:    (locationId: string, durationMs: number) => void
  cancelTravel:   () => void
  tickTravel:     () => boolean     // returns true if travel just completed
  markScanned:    (locationId: string) => void
  travelProgress: () => number      // 0–1
}

export const useMapStore = create<MapState>((set, get) => ({
  currentLocationId: 'sector-7/home',
  travelTargetId:    null,
  travelStartedAt:   null,
  travelDurationMs:  0,
  scanned:           ['sector-7/home'],

  startTravel: (locationId, durationMs) => set({
    travelTargetId:   locationId,
    travelStartedAt:  Date.now(),
    travelDurationMs: durationMs,
  }),

  cancelTravel: () => set({
    travelTargetId:  null,
    travelStartedAt: null,
    travelDurationMs: 0,
  }),

  tickTravel: () => {
    const { travelTargetId, travelStartedAt, travelDurationMs } = get()
    if (!travelTargetId || !travelStartedAt) return false
    if (Date.now() - travelStartedAt >= travelDurationMs) {
      set({
        currentLocationId: travelTargetId,
        travelTargetId:    null,
        travelStartedAt:   null,
        travelDurationMs:  0,
      })
      return true
    }
    return false
  },

  markScanned: (locationId) => set(s => ({
    scanned: s.scanned.includes(locationId) ? s.scanned : [...s.scanned, locationId],
  })),

  travelProgress: () => {
    const { travelStartedAt, travelDurationMs } = get()
    if (!travelStartedAt) return 0
    return Math.min(1, (Date.now() - travelStartedAt) / travelDurationMs)
  },
}))
