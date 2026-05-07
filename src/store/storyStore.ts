// ── storyStore.ts ─────────────────────────────────────────────────────────────
// Central story-state store. Tracks phase, flags, and all inter-system
// dependencies for the main narrative. See docs/STORY_MAP.md.
//
// Usage pattern:
//   import { useStoryStore } from './storyStore'
//   const { setFlag, hasFlag, phase } = useStoryStore()
//
// Triggers are checked externally (in triggerEngine.ts, once written) after
// every meaningful action. This store is the source of truth — not the trigger.

import { create } from 'zustand'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MissionId =
  | 'M-01' | 'M-02' | 'M-03' | 'M-04' | 'M-05' | 'M-06' | 'M-07' | 'M-08'
  | 'S-01' | 'S-02' | 'S-03' | 'S-04' | 'S-05' | 'S-06'

export type MissionStatus = 'inactive' | 'active' | 'complete' | 'failed'

export type StoryFlag =
  | 'ONBOARDING_COMPLETE'
  | 'FIRST_JOB_DONE'
  | 'UNDERGROUND_CONTACT_MADE'
  | 'SECTOR7_SUSPECTED'
  | 'SECTOR7_KNOWN'
  | 'OVERSEER_UNDERSTOOD'
  | 'FOUNDATION_KNOWN'
  | 'SPLICE_TRUSTED'
  | 'COMMUNE_TRUSTED'
  | 'ARCHIVIST_CHAIN_COMPLETE'
  | 'AGENT44_WARNED'
  | 'AGENT44_ESCALATED'
  | 'LOCKET_MET'
  | 'VAULT_FOUND'
  | 'BURNED_TRUST'

export type GridfallChoice = 'expose' | 'bury' | 'burn' | null

export interface StoryState {
  // ── Core progression ────────────────────────────────────────────────────────
  phase:    0 | 1 | 2 | 3 | 4 | 5 | 6
  missions: Record<MissionId, MissionStatus>
  flags:    Set<StoryFlag>

  // ── Economy ─────────────────────────────────────────────────────────────────
  credits:       number
  jobsCompleted: string[]

  // ── Hidden OVERSEER pressure ─────────────────────────────────────────────────
  overseerFlag: number   // 0–100, never surfaced to player directly

  // ── Browser ─────────────────────────────────────────────────────────────────
  browserHistory:  string[]
  browserUnlocks:  Set<string>
  pagesTriggered:  Set<string>

  // ── Filesystem ──────────────────────────────────────────────────────────────
  filesystemPaths: Set<string>
  filesRead:       Set<string>

  // ── Faction ─────────────────────────────────────────────────────────────────
  factionalChoices: Array<'corp' | 'underground' | 'neutral'>
  gridfallChoice:   GridfallChoice

  // ── Actions ─────────────────────────────────────────────────────────────────
  setFlag:           (flag: StoryFlag) => void
  hasFlag:           (flag: StoryFlag) => boolean

  setMission:        (id: MissionId, status: MissionStatus) => void
  getMission:        (id: MissionId) => MissionStatus

  advancePhase:      () => void
  setPhase:          (phase: StoryState['phase']) => void

  addCredits:        (amount: number) => void
  spendCredits:      (amount: number) => boolean   // returns false if insufficient

  recordJobComplete: (jobId: string) => void

  recordPageVisit:   (url: string) => void
  hasVisitedPage:    (url: string) => boolean
  isFirstVisit:      (url: string) => boolean      // true only once per url

  addFile:           (path: string) => void
  recordFileRead:    (path: string) => void
  hasReadFile:       (path: string) => boolean

  adjustOverseer:    (delta: number) => void

  recordFactionChoice: (choice: 'corp' | 'underground' | 'neutral') => void
  setGridfallChoice:   (choice: GridfallChoice) => void
}

// ── Initial mission statuses ───────────────────────────────────────────────────

const INITIAL_MISSIONS: Record<MissionId, MissionStatus> = {
  'M-01': 'inactive',
  'M-02': 'inactive',
  'M-03': 'inactive',
  'M-04': 'inactive',
  'M-05': 'inactive',
  'M-06': 'inactive',
  'M-07': 'inactive',
  'M-08': 'inactive',
  'S-01': 'inactive',
  'S-02': 'inactive',
  'S-03': 'inactive',
  'S-04': 'inactive',
  'S-05': 'inactive',
  'S-06': 'inactive',
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStoryStore = create<StoryState>((set, get) => ({
  phase:    0,
  missions: { ...INITIAL_MISSIONS },
  flags:    new Set(),

  credits:       0,
  jobsCompleted: [],

  overseerFlag: 0,

  browserHistory:  [],
  browserUnlocks:  new Set(),
  pagesTriggered:  new Set(),

  filesystemPaths: new Set(),
  filesRead:       new Set(),

  factionalChoices: [],
  gridfallChoice:   null,

  // ── Flag operations ──────────────────────────────────────────────────────────
  setFlag: (flag) =>
    set(s => { const f = new Set(s.flags); f.add(flag); return { flags: f } }),

  hasFlag: (flag) => get().flags.has(flag),

  // ── Mission operations ───────────────────────────────────────────────────────
  setMission: (id, status) =>
    set(s => ({ missions: { ...s.missions, [id]: status } })),

  getMission: (id) => get().missions[id],

  // ── Phase advancement ────────────────────────────────────────────────────────
  advancePhase: () =>
    set(s => ({ phase: clamp(s.phase + 1, 0, 6) as StoryState['phase'] })),

  setPhase: (phase) => set({ phase }),

  // ── Economy ──────────────────────────────────────────────────────────────────
  addCredits: (amount) =>
    set(s => ({ credits: s.credits + amount })),

  spendCredits: (amount) => {
    const { credits } = get()
    if (credits < amount) return false
    set(s => ({ credits: s.credits - amount }))
    return true
  },

  recordJobComplete: (jobId) =>
    set(s => ({
      jobsCompleted: s.jobsCompleted.includes(jobId)
        ? s.jobsCompleted
        : [...s.jobsCompleted, jobId]
    })),

  // ── Browser tracking ─────────────────────────────────────────────────────────
  recordPageVisit: (url) => {
    set(s => ({
      browserHistory: [...s.browserHistory, url],
    }))
  },

  hasVisitedPage: (url) => get().browserHistory.includes(url),

  isFirstVisit: (url) => {
    const { pagesTriggered } = get()
    if (pagesTriggered.has(url)) return false
    set(s => { const p = new Set(s.pagesTriggered); p.add(url); return { pagesTriggered: p } })
    return true
  },

  // ── Filesystem ───────────────────────────────────────────────────────────────
  addFile: (path) =>
    set(s => { const f = new Set(s.filesystemPaths); f.add(path); return { filesystemPaths: f } }),

  recordFileRead: (path) =>
    set(s => { const f = new Set(s.filesRead); f.add(path); return { filesRead: f } }),

  hasReadFile: (path) => get().filesRead.has(path),

  // ── OVERSEER ─────────────────────────────────────────────────────────────────
  adjustOverseer: (delta) =>
    set(s => ({ overseerFlag: clamp(s.overseerFlag + delta) })),

  // ── Faction ──────────────────────────────────────────────────────────────────
  recordFactionChoice: (choice) =>
    set(s => ({ factionalChoices: [...s.factionalChoices, choice] })),

  setGridfallChoice: (choice) => set({ gridfallChoice: choice }),
}))
