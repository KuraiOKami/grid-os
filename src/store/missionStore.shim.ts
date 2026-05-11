// ── missionStore.shim.ts ──────────────────────────────────────────────────────
// Phase 1d: Supabase-backed mission content store.
// Hydrates mission metadata and objectives from DB on boot.
// Player mission *statuses* are owned by storyStore (player_state table).

import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { MissionId, MissionStatus, StoryFlag } from './storyStore.shim'

export interface MissionRow {
  id:             MissionId
  title:          string
  description:    string | null
  prereq_flag:    StoryFlag | null
  sort_order:     number
  faction_tag:    'corp' | 'underground' | 'neutral' | null
  phase_gate:     number
  reward_credits: number
  reward_flags:   StoryFlag[]
  is_side_mission: boolean
}

export interface MissionObjectiveRow {
  id:            string
  mission_id:    MissionId
  description:   string
  condition_ast: unknown
  sort_order:    number
}

interface MissionShimState {
  hydrated:           boolean
  loading:            boolean
  error:              string | null
  missions:           Record<MissionId, MissionRow>
  objectives:         Record<MissionId, MissionObjectiveRow[]>
  // Runtime statuses — mirrors storyStore.missions, set by setMissionStatus
  statuses:           Record<MissionId, MissionStatus>
  completedObjectives: Record<string, boolean>

  hydrate:              () => Promise<void>
  setMissionStatus:     (id: MissionId, status: MissionStatus) => void
  setObjectiveComplete: (missionId: MissionId, objectiveId: string, complete?: boolean) => void
  getMission:           (id: MissionId) => MissionRow | null
  getObjectives:        (missionId: MissionId) => MissionObjectiveRow[]
}

const ALL_MISSION_IDS: MissionId[] = [
  'M-01','M-02','M-03','M-04','M-05','M-06','M-07','M-08',
  'S-01','S-02','S-03','S-04','S-05','S-06',
]

const DEFAULT_STATUSES = Object.fromEntries(
  ALL_MISSION_IDS.map(id => [id, 'inactive' as MissionStatus])
) as Record<MissionId, MissionStatus>

export const useMissionStore = create<MissionShimState>((set, get) => ({
  hydrated:            false,
  loading:             false,
  error:               null,
  missions:            {} as Record<MissionId, MissionRow>,
  objectives:          {} as Record<MissionId, MissionObjectiveRow[]>,
  statuses:            { ...DEFAULT_STATUSES },
  completedObjectives: {},

  hydrate: async () => {
    if (get().loading) return
    set({ loading: true, error: null })

    const [missionsRes, objectivesRes] = await Promise.all([
      supabase
        .from('missions')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('mission_objectives')
        .select('*')
        .order('sort_order', { ascending: true }),
    ])

    if (missionsRes.error) {
      set({ loading: false, error: missionsRes.error.message })
      return
    }
    if (objectivesRes.error) {
      set({ loading: false, error: objectivesRes.error.message })
      return
    }

    const missionMap = Object.fromEntries(
      (missionsRes.data ?? []).map(m => [m.id, m])
    ) as Record<MissionId, MissionRow>

    const objectiveMap = (objectivesRes.data ?? []).reduce((acc, obj) => {
      const key = obj.mission_id as MissionId
      if (!acc[key]) acc[key] = []
      acc[key].push(obj as MissionObjectiveRow)
      return acc
    }, {} as Record<MissionId, MissionObjectiveRow[]>)

    set({
      missions:  missionMap,
      objectives: objectiveMap,
      hydrated:  true,
      loading:   false,
    })
  },

  setMissionStatus: (id, status) =>
    set(s => ({ statuses: { ...s.statuses, [id]: status } })),

  setObjectiveComplete: (_missionId, objectiveId, complete = true) =>
    set(s => ({
      completedObjectives: { ...s.completedObjectives, [objectiveId]: complete },
    })),

  getMission:    (id) => get().missions[id] ?? null,
  getObjectives: (id) => get().objectives[id] ?? [],
}))
