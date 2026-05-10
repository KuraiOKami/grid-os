// ── triggerEngine.bridge.ts ───────────────────────────────────────────────────
// Phase 1d adapter: evaluates DB-authored triggers alongside the hand-coded
// switch cases in triggerEngine.ts WITHOUT replacing them.
//
// HOW TO WIRE IN (two lines in triggerEngine.ts):
//
//   // 1. Top of file:
//   import { runDatabaseTriggers } from './triggerEngine.bridge'
//
//   // 2. Bottom of checkTriggers(), after the switch block:
//   await runDatabaseTriggers(event)
//
// Once every hand-coded case has a DB equivalent authored via the Phase 2
// /admin editor, the corresponding switch cases can be deleted one by one.

import { supabase }             from '../lib/supabase'
import { snapshotGameState }    from '../lib/engine/evaluate'
import { evaluate }             from '../lib/engine/evaluate'
import { dispatchAll }          from '../lib/engine/dispatch'
import type { ConditionNode }   from '../lib/engine/conditionTypes'
import type { Effect }          from '../lib/engine/effects'
import type { TriggerEvent }    from './triggerEngine'
import { useStoryStore }        from './storyStore'

interface TriggerRow {
  id:            string
  condition_ast: ConditionNode
  effects:       Effect[]
  fire_once:     boolean
  phase_min:     number | null
  phase_max:     number | null
}

// In-memory set of already-fired fire_once triggers.
const _firedOnce = new Set<string>()

/**
 * Fetches enabled triggers from Supabase, evaluates them against current
 * game state, and dispatches effects for any that pass.
 */
export async function runDatabaseTriggers(_event: TriggerEvent): Promise<void> {
  const story = useStoryStore.getState()

  const { data, error } = await supabase
    .from('story_triggers')
    .select('id, condition_ast, effects, fire_once, phase_min, phase_max')
    .eq('enabled', true)

  if (error || !data) {
    console.warn('[triggerEngine.bridge] fetch failed:', error?.message)
    return
  }

  const snap = snapshotGameState()

  for (const row of data as TriggerRow[]) {
    if (row.fire_once && _firedOnce.has(row.id)) continue
    if (row.phase_min != null && story.phase < row.phase_min) continue
    if (row.phase_max != null && story.phase > row.phase_max) continue

    if (evaluate(row.condition_ast, snap)) {
      if (row.fire_once) {
        _firedOnce.add(row.id)
        void supabase
          .from('story_triggers')
          .update({ enabled: false })
          .eq('id', row.id)
      }
      await dispatchAll(row.effects)
    }
  }
}
