// ── missionStore.shim.ts ──────────────────────────────────────────────────────
// Thin shim for missionStore.ts — Phase 1d replacement.
//
// Mission definitions (title, giver, description, objectives, rewards) now
// live in Supabase (tables: missions, mission_objectives).  This store:
//   1. Hydrates on boot by fetching all missions + objectives from Supabase
//   2. Exposes the identical selector/mutation API as the original
//   3. Delegates status changes to storyStore (single source of truth)
//
// MIGRATION STEPS:
//   1. Rename missionStore.ts → missionStore.legacy.ts
//   2. Rename this file       → missionStore.ts
//   3. Remove missionStore.legacy.ts once smoke tests pass

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { MissionId, MissionStatus, StoryFlag } from './storyStore'
import { useStoryStore } from './storyStore'

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
  filesAdded?:   string[]
  emailsQueued?: string[]
}

export interface MissionFailure {
  condition:   string
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
  missions:     Record<string, MissionDef>
  hydrated:     boolean

  activeMissions:    () => MissionDef[]
  completedMissions: () => MissionDef[]

  setObjectiveComplete:  (missionId: MissionId, objectiveId: string) => void
  allObjectivesComplete: (missionId: MissionId) => boolean
  setMissionStatus:      (missionId: MissionId, status: MissionStatus) => void
  getMissionStatus:      (missionId: MissionId) => MissionStatus

  hydrateFromSupabase: () => Promise<void>
}

export const useMissionStore = create<MissionState>((set, get) => ({
  missions: {},
  hydrated: false,

  activeMissions:    () => Object.values(get().missions).filter(m => m.status === 'active'),
  completedMissions: () => Object.values(get().missions).filter(m => m.status === 'complete'),

  getMissionStatus: (id) => useStoryStore.getState().getMission(id),

  setMissionStatus: (id, status) => {
    useStoryStore.getState().setMission(id, status)
    set(s => {
      const m = s.missions[id]
      if (!m) return s
      return { missions: { ...s.missions, [id]: { ...m, status } } }
    })
  },

  setObjectiveComplete: (missionId, objectiveId) => {
    set(s => {
      const m = s.missions[missionId]
      if (!m) return s
      return {
        missions: {
          ...s.missions,
          [missionId]: {
            ...m,
            objectives: m.objectives.map(o =>
              o.id === objectiveId ? { ...o, complete: true } : o
            ),
          },
        },
      }
    })
  },

  allObjectivesComplete: (missionId) =>
    get().missions[missionId]?.objectives.every(o => o.complete) ?? false,

  hydrateFromSupabase: async () => {
    const { data: mRows, error: mErr } = await supabase
      .from('missions')
      .select('id, title, giver, description, notes, reward_json, failure_json')

    if (mErr || !mRows) {
      console.warn('[missionStore.shim] hydrate missions failed:', mErr?.message)
      return
    }

    const { data: oRows, error: oErr } = await supabase
      .from('mission_objectives')
      .select('id, mission_id, label, sort_order')
      .order('sort_order', { ascending: true })

    if (oErr || !oRows) {
      console.warn('[missionStore.shim] hydrate objectives failed:', oErr?.message)
      return
    }

    const objByMission: Record<string, MissionObjective[]> = {}
    for (const o of oRows) {
      if (!objByMission[o.mission_id]) objByMission[o.mission_id] = []
      objByMission[o.mission_id].push({ id: o.id, label: o.label, complete: false })
    }

    const storyMissions = useStoryStore.getState().missions

    const built: Record<string, MissionDef> = {}
    for (const m of mRows) {
      built[m.id] = {
        id:          m.id as MissionId,
        title:       m.title,
        giver:       m.giver,
        description: m.description,
        notes:       m.notes ?? undefined,
        status:      storyMissions[m.id as MissionId] ?? 'inactive',
        objectives:  objByMission[m.id] ?? [],
        reward:      (m.reward_json  as MissionReward)  ?? {},
        failure:     (m.failure_json as MissionFailure) ?? undefined,
      }
    }

    set({ missions: built, hydrated: true })
  },
}))
