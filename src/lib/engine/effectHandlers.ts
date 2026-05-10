// ── src/lib/engine/effectHandlers.ts ─────────────────────────────────────────
// One handler per Effect type. Handlers are pure functions that receive
// a single effect and call into Zustand stores. No React hooks.
//
// Import order: store getState() calls happen inside each handler so this
// module is safe to import anywhere (no circular init issues).

import type { Effect } from './types'
import { useStoryStore }       from '@/store/storyStore'
import { useMissionStore }     from '@/store/missionStore.shim'
import { useRepStore }         from '@/store/reputationStore'
import { useFSStore }          from '@/store/fsStore'
import { queueStoryEmail }     from '@/store/emailQueue'

// ─────────────────────────────────────────────────────────────────────────────
// Handler map
// Each key is an Effect['type']. The value is a function that executes it.
// ─────────────────────────────────────────────────────────────────────────────

type EffectHandler<T extends Effect> = (effect: T) => void | Promise<void>

export const effectHandlers: {
  [K in Effect['type']]: EffectHandler<Extract<Effect, { type: K }>>
} = {

  set_flag({ flag }) {
    useStoryStore.getState().setFlag(flag)
  },

  set_mission({ id, status }) {
    useStoryStore.getState().setMission(id, status)
    useMissionStore.getState().setMissionStatus(id, status)
  },

  complete_objective({ missionId, objectiveId }) {
    useMissionStore.getState().setObjectiveComplete(missionId, objectiveId)
  },

  add_credits({ amount }) {
    useStoryStore.getState().addCredits(amount)
  },

  adjust_overseer({ delta }) {
    useStoryStore.getState().adjustOverseer(delta)
  },

  adjust_rep({ track, delta }) {
    useRepStore.getState().adjust(track, delta)
  },

  async queue_email({ storyId, delayMs }) {
    await queueStoryEmail(storyId, delayMs)
  },

  drop_file({ name, content }) {
    useFSStore.getState().writeFile(['home', 'citizen', name], content)
  },

  set_phase({ phase }) {
    useStoryStore.getState().setPhase(phase)
  },

  advance_phase(_effect) {
    useStoryStore.getState().advancePhase()
  },

  console_warn({ message }) {
    console.warn('[engine]', message)
  },
}
