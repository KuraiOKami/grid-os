// ── src/lib/engine/index.ts ───────────────────────────────────────────────────
// Public surface of the engine module.
// Import from '@/lib/engine' — not from sub-files directly.

export type {
  ConditionNode,
  Effect,
  GameStateSnapshot,
  TriggerRow,
  TriggerEvent,
  RepTrack,
} from './types'

export { evaluate, buildSnapshot } from './evaluator'
export { effectHandlers }         from './effectHandlers'
export { triggerEffect, dispatchEffects, runTrigger } from './dispatch'
