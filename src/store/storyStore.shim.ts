// ── storyStore.shim.ts ────────────────────────────────────────────────────────
// Drop-in replacement for storyStore.ts once Phase 1d is complete.
//
// Keeps the exact same selector/mutation interface that every component
// already uses.  The difference: this store writes through to Supabase on
// every mutation and hydrates from `player_state` on boot.
//
// MIGRATION STEPS:
//   1. Rename storyStore.ts → storyStore.legacy.ts  (keep for reference)
//   2. Rename this file     → storyStore.ts
//   3. Remove storyStore.legacy.ts once smoke tests pass

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

// ── Types (re-exported so callers need zero import changes) ───────────────────

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

interface PlayerStateRow {
  player_id:        string
  phase:            number
  credits:          number
  overseer_flag:    number
  gridfall_choice:  GridfallChoice
  flags:            string[]
  missions:         Record<string, string>
  browser_history:  string[]
  browser_unlocks:  string[]
  pages_triggered:  string[]
  filesystem_paths: string[]
  files_read:       string[]
  emails_read:      string[]
  jobs_completed:   string[]
  factional_choices: Array<'corp' | 'underground' | 'neutral'>
}

export interface StoryState {
  phase:            0 | 1 | 2 | 3 | 4 | 5 | 6
  missions:         Record<MissionId, MissionStatus>
  flags:            Set<StoryFlag>
  credits:          number
  jobsCompleted:    string[]
  overseerFlag:     number
  browserHistory:   string[]
  browserUnlocks:   Set<string>
  pagesTriggered:   Set<string>
  filesystemPaths:  Set<string>
  filesRead:        Set<string>
  emailsRead:       Set<string>
  factionalChoices: Array<'corp' | 'underground' | 'neutral'>
  gridfallChoice:   GridfallChoice
  _user:            User | null

  hasFlag:    (flag: StoryFlag) => boolean
  getMission: (id: MissionId)   => MissionStatus

  setFlag:            (flag: StoryFlag)    => void
  removeFlag:         (flag: StoryFlag)    => void
  setMission:         (id: MissionId, status: MissionStatus) => void
  setPhase:           (phase: StoryState['phase']) => void
  addCredits:         (amount: number)     => void
  adjustOverseer:     (delta: number)      => void
  unlockBrowserUrl:   (url: string)        => void
  recordPageVisit:    (url: string)        => void
  recordFileRead:     (path: string)       => void
  recordEmailRead:    (emailId: string)    => void
  completeJob:        (jobId: string)      => void
  addFSPath:          (path: string)       => void
  addFactionalChoice: (choice: 'corp' | 'underground' | 'neutral') => void
  setGridfallChoice:  (choice: GridfallChoice) => void

  hydrateFromSupabase: (user: User) => Promise<void>
}

const DEFAULT_MISSIONS = Object.fromEntries(
  (['M-01','M-02','M-03','M-04','M-05','M-06','M-07','M-08',
    'S-01','S-02','S-03','S-04','S-05','S-06'] as MissionId[])
    .map(id => [id, 'inactive' as MissionStatus])
) as Record<MissionId, MissionStatus>

async function persist(state: StoryState) {
  if (!state._user) return
  const { error } = await supabase.from('player_state').upsert({
    player_id:         state._user.id,
    phase:             state.phase,
    credits:           state.credits,
    overseer_flag:     state.overseerFlag,
    gridfall_choice:   state.gridfallChoice,
    flags:             Array.from(state.flags),
    missions:          state.missions,
    browser_history:   state.browserHistory,
    browser_unlocks:   Array.from(state.browserUnlocks),
    pages_triggered:   Array.from(state.pagesTriggered),
    filesystem_paths:  Array.from(state.filesystemPaths),
    files_read:        Array.from(state.filesRead),
    emails_read:       Array.from(state.emailsRead),
    jobs_completed:    state.jobsCompleted,
    factional_choices: state.factionalChoices,
  }, { onConflict: 'player_id' })
  if (error) console.warn('[storyStore.shim] persist failed:', error.message)
}

export const useStoryStore = create<StoryState>((set, get) => ({
  phase:            0,
  missions:         { ...DEFAULT_MISSIONS },
  flags:            new Set(),
  credits:          0,
  jobsCompleted:    [],
  overseerFlag:     0,
  browserHistory:   [],
  browserUnlocks:   new Set(),
  pagesTriggered:   new Set(),
  filesystemPaths:  new Set(),
  filesRead:        new Set(),
  emailsRead:       new Set(),
  factionalChoices: [],
  gridfallChoice:   null,
  _user:            null,

  hasFlag:    (flag) => get().flags.has(flag),
  getMission: (id)   => get().missions[id],

  setFlag: (flag) => {
    set(s => ({ flags: new Set([...s.flags, flag]) }))
    void persist(get())
  },
  removeFlag: (flag) => {
    set(s => { const f = new Set(s.flags); f.delete(flag); return { flags: f } })
    void persist(get())
  },
  setMission: (id, status) => {
    set(s => ({ missions: { ...s.missions, [id]: status } }))
    void persist(get())
  },
  setPhase: (phase) => {
    set({ phase })
    void persist(get())
  },
  addCredits: (amount) => {
    set(s => ({ credits: s.credits + amount }))
    void persist(get())
  },
  adjustOverseer: (delta) => {
    set(s => ({ overseerFlag: Math.max(0, Math.min(100, s.overseerFlag + delta)) }))
    void persist(get())
  },
  unlockBrowserUrl: (url) => {
    set(s => ({ browserUnlocks: new Set([...s.browserUnlocks, url]) }))
    void persist(get())
  },
  recordPageVisit: (url) => {
    set(s => ({ browserHistory: [...s.browserHistory, url] }))
    void persist(get())
  },
  recordFileRead: (path) => {
    set(s => ({ filesRead: new Set([...s.filesRead, path]) }))
    void persist(get())
  },
  recordEmailRead: (emailId) => {
    set(s => ({ emailsRead: new Set([...s.emailsRead, emailId]) }))
    void persist(get())
  },
  completeJob: (jobId) => {
    set(s => ({ jobsCompleted: [...s.jobsCompleted, jobId] }))
    void persist(get())
  },
  addFSPath: (path) => {
    set(s => ({ filesystemPaths: new Set([...s.filesystemPaths, path]) }))
    void persist(get())
  },
  addFactionalChoice: (choice) => {
    set(s => ({ factionalChoices: [...s.factionalChoices, choice] }))
    void persist(get())
  },
  setGridfallChoice: (choice) => {
    set({ gridfallChoice: choice })
    void persist(get())
  },

  hydrateFromSupabase: async (user) => {
    set({ _user: user })
    const { data, error } = await supabase
      .from('player_state')
      .select('*')
      .eq('player_id', user.id)
      .single()

    if (error || !data) {
      void persist(get())
      return
    }

    const row = data as PlayerStateRow
    set({
      phase:            row.phase as StoryState['phase'],
      credits:          row.credits,
      overseerFlag:     row.overseer_flag,
      gridfallChoice:   row.gridfall_choice,
      flags:            new Set(row.flags as StoryFlag[]),
      missions:         { ...DEFAULT_MISSIONS, ...row.missions } as Record<MissionId, MissionStatus>,
      browserHistory:   row.browser_history   ?? [],
      browserUnlocks:   new Set(row.browser_unlocks   ?? []),
      pagesTriggered:   new Set(row.pages_triggered   ?? []),
      filesystemPaths:  new Set(row.filesystem_paths  ?? []),
      filesRead:        new Set(row.files_read         ?? []),
      emailsRead:       new Set(row.emails_read        ?? []),
      jobsCompleted:    row.jobs_completed    ?? [],
      factionalChoices: row.factional_choices ?? [],
    })
  },
}))
