// ── engine/index.ts ───────────────────────────────────────────────────────────
// Barrel export for the condition engine package.
// Import from '@/lib/engine' rather than deep paths.

export type { ConditionNode }      from './conditionTypes'
export type { GameStateSnapshot }  from './evaluate'
export type { Effect }             from './effects'

export { evaluate, snapshotGameState } from './evaluate'
export { dispatchEffect, dispatchAll } from './dispatch'
