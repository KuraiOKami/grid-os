// ── src/lib/engine/evaluator.ts ───────────────────────────────────────────────
// Pure condition evaluator. Takes a ConditionNode + a GameStateSnapshot
// and returns boolean. No store imports, no side effects — fully unit-testable.

import type { ConditionNode, GameStateSnapshot } from './types'

/**
 * Evaluate a condition AST node against a game state snapshot.
 *
 * @example
 *   const fires = evaluate(
 *     { type: 'and', nodes: [
 *       { type: 'flag', flag: 'FIRST_JOB_DONE' },
 *       { type: 'phase_gte', phase: 1 },
 *     ]},
 *     snapshot
 *   )
 */
export function evaluate(node: ConditionNode, state: GameStateSnapshot): boolean {
  switch (node.type) {
    // ── Boolean combinators ────────────────────────────────────────────────────
    case 'and':
      return node.nodes.every(n => evaluate(n, state))

    case 'or':
      return node.nodes.some(n => evaluate(n, state))

    case 'not':
      return !evaluate(node.node, state)

    // ── Flag checks ───────────────────────────────────────────────────────────
    case 'flag':
      return state.flags.has(node.flag)

    case 'no_flag':
      return !state.flags.has(node.flag)

    // ── Mission checks ────────────────────────────────────────────────────────
    case 'mission':
      return state.missions[node.id] === node.status

    // ── Phase checks ─────────────────────────────────────────────────────────
    case 'phase_gte':
      return state.phase >= node.phase

    case 'phase_eq':
      return state.phase === node.phase

    // ── Reputation checks ─────────────────────────────────────────────────────
    case 'rep_gte':
      return state.rep[node.track] >= node.value

    case 'rep_lt':
      return state.rep[node.track] < node.value

    // ── OVERSEER check ────────────────────────────────────────────────────────
    case 'overseer_gte':
      return state.overseerFlag >= node.value

    // ── Browser / job history ─────────────────────────────────────────────────
    case 'page_visited':
      return state.browserHistory.includes(node.url)

    case 'job_done':
      return state.jobsCompleted.includes(node.jobId)

    // ── Economy ───────────────────────────────────────────────────────────────
    case 'credits_gte':
      return state.credits >= node.amount

    // ── Unconditional ─────────────────────────────────────────────────────────
    case 'true':
      return true

    // ── Exhaustive guard ──────────────────────────────────────────────────────
    default: {
      const _exhaustive: never = node
      console.warn('[engine/evaluator] Unknown node type:', _exhaustive)
      return false
    }
  }
}

/**
 * Build a GameStateSnapshot from the current live store states.
 * Call this inside checkTriggers() right before evaluating.
 */
export function buildSnapshot(
  story:    { phase: GameStateSnapshot['phase']; flags: Set<import('@/store/storyStore').StoryFlag>; missions: Record<import('@/store/storyStore').MissionId, import('@/store/storyStore').MissionStatus>; overseerFlag: number; jobsCompleted: string[]; browserHistory: string[]; credits: number },
  rep:      { compliance: number; shadow: number; community: number },
): GameStateSnapshot {
  return {
    phase:          story.phase,
    flags:          story.flags,
    missions:       story.missions,
    overseerFlag:   story.overseerFlag,
    jobsCompleted:  story.jobsCompleted,
    browserHistory: story.browserHistory,
    credits:        story.credits,
    rep: {
      compliance: rep.compliance,
      shadow:     rep.shadow,
      community:  rep.community,
    },
  }
}
