// ── dispatch.ts ───────────────────────────────────────────────────────────────
// Routes an Effect to the correct store mutation.
//
// This is the ONLY file that imports Zustand stores for write purposes inside
// the engine package.  evaluate.ts is pure; conditionTypes/effects are types.
//
// Usage (inside triggerEngine.ts or the OVERSEER loop):
//   import { dispatchEffect } from '@/lib/engine/dispatch'
//   for (const effect of trigger.effects) {
//     await dispatchEffect(effect as Effect)
//   }

import type { Effect } from './effects'
import { useStoryStore }   from '../../store/storyStore'
import { useMissionStore } from '../../store/missionStore'
import { useRepStore }     from '../../store/reputationStore'
import { queueStoryEmail } from '../../store/emailQueue'
import { supabase }        from '../supabase'

export async function dispatchEffect(effect: Effect): Promise<void> {
  const story    = useStoryStore.getState()
  const missions = useMissionStore.getState()
  const rep      = useRepStore.getState()

  switch (effect.type) {

    case 'set_flag':
      story.setFlag(effect.flag)
      break

    case 'remove_flag':
      story.removeFlag(effect.flag)
      break

    case 'set_mission':
      missions.setMissionStatus(effect.missionId, effect.status)
      story.setMission(effect.missionId, effect.status)
      break

    case 'set_objective':
      missions.setObjectiveComplete(effect.missionId, effect.objectiveId)
      break

    case 'add_credits':
      story.addCredits(effect.amount)
      break

    case 'adjust_rep':
      rep.adjust(effect.stat, effect.delta)
      break

    case 'set_phase':
      story.setPhase(effect.phase)
      break

    case 'drop_file': {
      const { data, error } = await supabase
        .from('story_files')
        .select('slug, content')
        .eq('slug', effect.slug)
        .single()
      if (error || !data) {
        console.warn(`[dispatch] drop_file: could not fetch slug "${effect.slug}"`, error?.message)
        break
      }
      const { useFSStore } = await import('../../store/fsStore')
      useFSStore.getState().writeFile(['home', 'citizen', data.slug], data.content)
      break
    }

    case 'queue_email':
      await queueStoryEmail(effect.storyId, effect.delayMs ?? 0)
      break

    case 'adjust_overseer':
      story.adjustOverseer(effect.delta)
      break

    case 'unlock_url':
      story.unlockBrowserUrl(effect.url)
      break

    case 'journal_entry': {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) break
      await supabase.from('journal_entries').insert({
        player_id:  user.id,
        body:       effect.body,
        phase:      story.phase,
        tags:       effect.tags ?? [],
      })
      break
    }

    default: {
      const _: never = effect
      console.warn('[dispatch] Unknown effect type:', (_ as Effect).type)
    }
  }
}

/** Fires all effects in a trigger's effects array in order. */
export async function dispatchAll(effects: Effect[]): Promise<void> {
  for (const effect of effects) {
    await dispatchEffect(effect)
  }
}
