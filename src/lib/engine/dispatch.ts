// ── src/lib/engine/dispatch.ts ────────────────────────────────────────────────
// Dispatch a single Effect or an array of Effects through the handler map.
// Also exports runTrigger() which evaluates a TriggerRow against live state
// and fires its effects if the condition passes.

import { evaluate, buildSnapshot } from './evaluator'
import { effectHandlers }         from './effectHandlers'
import type { Effect, TriggerRow } from './types'
import { useStoryStore }          from '@/store/storyStore'
import { useRepStore }            from '@/store/reputationStore'

/**
 * Dispatch one effect through the handler map.
 */
export function triggerEffect(effect: Effect): void | Promise<void> {
  const handler = effectHandlers[effect.type] as (e: Effect) => void | Promise<void>
  return handler(effect)
}

/**
 * Dispatch an ordered array of effects sequentially.
 * Async effects (queue_email) are awaited before proceeding to the next.
 */
export async function dispatchEffects(effects: Effect[]): Promise<void> {
  for (const effect of effects) {
    await triggerEffect(effect)
  }
}

/**
 * Evaluate a TriggerRow against current live game state.
 * Fires all its effects if the condition passes.
 * Returns true if the trigger fired, false if the condition was not met.
 */
export async function runTrigger(row: TriggerRow): Promise<boolean> {
  const story = useStoryStore.getState()
  const rep   = useRepStore.getState()

  const snapshot = buildSnapshot(
    {
      phase:          story.phase,
      flags:          story.flags,
      missions:       story.missions,
      overseerFlag:   story.overseerFlag,
      jobsCompleted:  story.jobsCompleted,
      browserHistory: story.browserHistory,
      credits:        story.credits,
    },
    {
      compliance: rep.compliance,
      shadow:     rep.shadow,
      community:  rep.community ?? 0,
    },
  )

  if (!evaluate(row.condition_ast, snapshot)) return false

  await dispatchEffects(row.effects)
  return true
}
