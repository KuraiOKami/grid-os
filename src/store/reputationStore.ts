// ── reputationStore.ts ───────────────────────────────────────────────────────
// Two independent reputation axes:
//   compliance  — GridOS trust. High = corporate access, low = blacklisted.
//   shadow      — Street cred.  High = underground access, low = nobody trusts you.
//
// Both run 0–100. They are NOT opposites — you can have both high (double agent)
// or both low (chaotic freelancer). Actions shift one or both.

import { create } from 'zustand'

export type RepAxis = 'compliance' | 'shadow'

export interface ReputationState {
  compliance: number
  shadow: number

  // Adjust a score by a delta (clamped 0–100)
  adjust: (axis: RepAxis, delta: number) => void

  // Convenience: apply a map of changes at once
  applyEvent: (changes: Partial<Record<RepAxis, number>>) => void

  // Tier labels for UI
  complianceLabel: () => string
  shadowLabel: () => string
}

function clamp(v: number) { return Math.max(0, Math.min(100, v)) }

function complianceLabel(v: number): string {
  if (v >= 80) return 'Trusted'
  if (v >= 55) return 'Observed'
  if (v >= 30) return 'Flagged'
  return 'Blacklisted'
}

function shadowLabel(v: number): string {
  if (v >= 80) return 'Legend'
  if (v >= 55) return 'Known'
  if (v >= 30) return 'Stranger'
  return 'Ghost'
}

export const useRepStore = create<ReputationState>((set, get) => ({
  compliance: 50,
  shadow: 50,

  adjust: (axis, delta) =>
    set(state => ({ [axis]: clamp(state[axis] + delta) })),

  applyEvent: (changes) =>
    set(state => {
      const next: Partial<ReputationState> = {}
      if (changes.compliance !== undefined)
        next.compliance = clamp(state.compliance + changes.compliance)
      if (changes.shadow !== undefined)
        next.shadow = clamp(state.shadow + changes.shadow)
      return next
    }),

  complianceLabel: () => complianceLabel(get().compliance),
  shadowLabel:     () => shadowLabel(get().shadow),
}))

// ── Rep event presets ─────────────────────────────────────────────────────────
// Import these wherever an action should change reputation.
export const REP_EVENTS = {
  // Watch app decisions
  watchNoThreat:    { compliance: +1,  shadow:  0  },
  watchLowConcern:  { compliance: +2,  shadow: -1  },
  watchFlag:        { compliance: +3,  shadow: -2  },
  watchEscalate:    { compliance: +5,  shadow: -5  },
  watchBury:        { compliance: -3,  shadow: +3  },

  // Job completions
  jobCorpComplete:  { compliance: +2,  shadow:  0  },
  jobAnonComplete:  { compliance: -1,  shadow: +2  },
  jobArchiveHelp:   { compliance: -2,  shadow: +3  },

  // Browsing
  visitHiddenPage:  { compliance: -1,  shadow: +1  },
  visitCorpPage:    { compliance: +1,  shadow:  0  },

  // Market
  buyGridMart:      { compliance: +1,  shadow:  0  },
  buyVoidBay:       { compliance: -1,  shadow: +1  },
} satisfies Record<string, Partial<Record<RepAxis, number>>>
