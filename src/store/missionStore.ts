// ── missionStore.ts ───────────────────────────────────────────────────────────
// Mission definitions and objective tracking for M-01, M-02, M-03.
// Objectives are individually trackable. Completion logic lives in
// triggerEngine.ts — this store is the readable state, not the trigger.
//
// Each mission has:
//   - id, title, giver, description
//   - objectives[]: each with id, label, complete flag
//   - reward: { credits, compliance, shadow, flags, filesAdded, emailsQueued }
//   - failureState: optional failure conditions + penalty

import { create } from 'zustand'
import type { MissionId, MissionStatus, StoryFlag } from './storyStore'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MissionObjective {
  id:       string
  label:    string
  complete: boolean
}

export interface MissionReward {
  credits?:      number
  compliance?:   number
  shadow?:       number
  flags?:        StoryFlag[]
  filesAdded?:   string[]    // paths added to ~/
  emailsQueued?: string[]    // email IDs to deliver after completion
}

export interface MissionFailure {
  condition:   string        // human-readable trigger description
  compliance?: number
  shadow?:     number
  notes?:      string
}

export interface MissionDef {
  id:          MissionId
  title:       string
  giver:       string
  description: string
  notes?:      string
  status:      MissionStatus
  objectives:  MissionObjective[]
  reward:      MissionReward
  failure?:    MissionFailure
}

interface MissionState {
  missions: Record<MissionId, MissionDef>

  activeMissions: () => MissionDef[]
  completedMissions: () => MissionDef[]

  setObjectiveComplete: (missionId: MissionId, objectiveId: string) => void
  allObjectivesComplete: (missionId: MissionId) => boolean

  setMissionStatus: (missionId: MissionId, status: MissionStatus) => void
  getMissionStatus: (missionId: MissionId) => MissionStatus
}

// ── Mission definitions ───────────────────────────────────────────────────────

const MISSION_DEFS: Record<MissionId, MissionDef> = {
  // ──────────────────────────────────────────────────────────────────────────
  // M-01 — FIRST BOOT
  // Tutorial mission. Cannot fail. Triggered on game start.
  // ──────────────────────────────────────────────────────────────────────────
  'M-01': {
    id:          'M-01',
    title:       'First Boot',
    giver:       'GRETA-7',
    description: 'Welcome, citizen. Your node has been initialized. Complete your onboarding before your first shift.',
    notes:       'Tutorial mission. Cannot fail. GRETA-7 is dismissed on completion — but she keeps watching.',
    status:      'inactive',
    objectives: [
      {
        id:       'M01-OBJ-1',
        label:    'Open the browser and visit gridos.corp',
        complete: false,
      },
      {
        id:       'M01-OBJ-2',
        label:    'Read your first two onboarding emails',
        complete: false,
      },
      {
        id:       'M01-OBJ-3',
        label:    'Open the file manager and view your home directory',
        complete: false,
      },
    ],
    reward: {
      credits:      100,
      flags:        ['ONBOARDING_COMPLETE'],
      emailsQueued: ['E-03'],  // HR employment agreement delivered immediately on completion
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // M-02 — JUST A JOB
  // Trigger: E-02 read.
  // Player must complete any one job from gridos.corp/careers or
  // clearpath.gridcorp.net. No guide is given — they figure it out.
  // ──────────────────────────────────────────────────────────────────────────
  'M-02': {
    id:          'M-02',
    title:       'Just a Job',
    giver:       'Marcus Tell',
    description: 'There is a jobs board at gridos.corp/careers and at clearpath.gridcorp.net. Pick something. Do it.',
    notes:       'Marcus doesn\'t explain the stakes. He barely knows them himself. No job guide is provided — accept and figure it out.',
    status:      'inactive',
    objectives: [
      {
        id:       'M02-OBJ-1',
        label:    'Complete any job from gridos.corp/careers or clearpath.gridcorp.net',
        complete: false,
      },
    ],
    reward: {
      // Credits are variable: 80–420 depending on job chosen. Applied dynamically.
      compliance:   1,
      flags:        ['FIRST_JOB_DONE'],
      filesAdded:   ['memo_1_it_reminder.txt'],  // Marcus Tell IT reminder
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // M-03 — GHOST SIGNAL
  // Trigger: E-10 read + replied.
  // Player must find and export a hidden file from the Gridcorp intranet.
  // Two completion routes: compliance gate OR terminal extraction.
  // Failure if overseerFlag ≥ 90 before completion.
  // ──────────────────────────────────────────────────────────────────────────
  'M-03': {
    id:          'M-03',
    title:       'Ghost Signal',
    giver:       'Null',
    description: 'There is something on the Gridcorp intranet. I need it extracted. Do not get caught.',
    notes:       'Null gives no further instructions. The player discovers the target by exploring gridos.corp/internal or /compliance.',
    status:      'inactive',
    objectives: [
      {
        id:       'M03-OBJ-1',
        label:    'Find a hidden file on the Gridcorp intranet (gridos.corp/internal or /compliance)',
        complete: false,
      },
      {
        id:       'M03-OBJ-2',
        label:    'Export the file (ROOT BLOOM memo, OVERSEER advisory, or compliance queue data)',
        complete: false,
      },
      {
        id:       'M03-OBJ-3',
        label:    'Reply to Null confirming delivery',
        complete: false,
      },
    ],
    reward: {
      credits:      600,
      shadow:       3,
      filesAdded:   ['memo_2_overseer_anomaly_preliminary.txt'],
      emailsQueued: ['E-12'],  // Silas / Commune intro, delayed 20 min after completion
    },
    failure: {
      condition:  'overseerFlag ≥ 90 before all objectives complete',
      compliance: -15,
      notes:      'Agent 44 email delivered. M-03 locked for 48-hour cooldown. Mission status → failed, then reattempt window opens.',
    },
  },

  // ── Placeholder stubs for remaining missions (status: inactive) ───────────
  'M-04': { id: 'M-04', title: 'Behind the Curtain', giver: 'Silas Okafor', description: '', status: 'inactive', objectives: [], reward: {} },
  'M-05': { id: 'M-05', title: 'The Splice Job',     giver: 'Fray',         description: '', status: 'inactive', objectives: [], reward: {} },
  'M-06': { id: 'M-06', title: 'Deep Cover',         giver: 'Commune',      description: '', status: 'inactive', objectives: [], reward: {} },
  'M-07': { id: 'M-07', title: 'The Archivist',      giver: 'E-25',         description: '', status: 'inactive', objectives: [], reward: {} },
  'M-08': { id: 'M-08', title: 'Gridfall',           giver: 'Null + Silas', description: '', status: 'inactive', objectives: [], reward: {} },
  'S-01': { id: 'S-01', title: 'Lost Courier',       giver: 'self',         description: '', status: 'inactive', objectives: [], reward: {} },
  'S-02': { id: 'S-02', title: 'The Noodle Cipher',  giver: 'E-23',         description: '', status: 'inactive', objectives: [], reward: {} },
  'S-03': { id: 'S-03', title: 'Reputation Run',     giver: 'E-26',         description: '', status: 'inactive', objectives: [], reward: {} },
  'S-04': { id: 'S-04', title: 'The Phisher',        giver: 'E-14',         description: '', status: 'inactive', objectives: [], reward: {} },
  'S-05': { id: 'S-05', title: "Hex's Errand",       giver: 'hex-shop',     description: '', status: 'inactive', objectives: [], reward: {} },
  'S-06': { id: 'S-06', title: 'GridSocial Stalker', giver: 'Locket',       description: '', status: 'inactive', objectives: [], reward: {} },
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMissionStore = create<MissionState>((set, get) => ({
  missions: MISSION_DEFS,

  activeMissions: () =>
    Object.values(get().missions).filter(m => m.status === 'active'),

  completedMissions: () =>
    Object.values(get().missions).filter(m => m.status === 'complete'),

  setObjectiveComplete: (missionId, objectiveId) =>
    set(s => ({
      missions: {
        ...s.missions,
        [missionId]: {
          ...s.missions[missionId],
          objectives: s.missions[missionId].objectives.map(o =>
            o.id === objectiveId ? { ...o, complete: true } : o
          ),
        },
      },
    })),

  allObjectivesComplete: (missionId) =>
    get().missions[missionId].objectives.every(o => o.complete),

  setMissionStatus: (missionId, status) =>
    set(s => ({
      missions: {
        ...s.missions,
        [missionId]: { ...s.missions[missionId], status },
      },
    })),

  getMissionStatus: (missionId) => get().missions[missionId].status,
}))
