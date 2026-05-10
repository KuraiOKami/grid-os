// ── evaluate.ts ───────────────────────────────────────────────────────────────
// Pure function that walks a ConditionNode tree against a GameStateSnapshot.
//
// Deliberately has zero imports from React or Zustand — call it anywhere,
// including outside of component trees (e.g. in the OVERSEER loop).
//
// Usage:
//   import { evaluate } from '@/lib/engine/evaluate'
//   const snap = snapshotGameState()
//   if (evaluate(trigger.condition_ast, snap)) { ... }

import type { ConditionNode } from './conditionTypes'
import type { StoryFlag, MissionId, MissionStatus } from '../../store/storyStore'

// ── GameStateSnapshot ─────────────────────────────────────────────────────────
// A plain-object snapshot of everything the evaluator needs.
// Built once per checkTriggers() call so reads are synchronous.

export interface GameStateSnapshot {
  phase:          number
  flags:          ReadonlySet<StoryFlag>
  missions:       Readonly<Record<MissionId, MissionStatus>>
  credits:        number
  compliance:     number
  shadow:         number
  browserHistory: readonly string[]
  filesRead:      ReadonlySet<string>
  emailsRead:     ReadonlySet<string>
  jobsCompleted:  readonly string[]
  overseerFlag:   number
}

// ── evaluate ──────────────────────────────────────────────────────────────────

export function evaluate(node: ConditionNode, s: GameStateSnapshot): boolean {
  switch (node.op) {
    case 'always':         return true
    case 'never':          return false

    case 'flag':           return s.flags.has(node.flag)
    case 'no_flag':        return !s.flags.has(node.flag)

    case 'phase_gte':      return s.phase >= node.value
    case 'phase_eq':       return s.phase === node.value

    case 'mission_status': return s.missions[node.missionId] === node.status

    case 'credits_gte':    return s.credits >= node.value

    case 'rep_gte':
      return node.stat === 'compliance'
        ? s.compliance >= node.value
        : s.shadow >= node.value

    case 'visited':        return s.browserHistory.includes(node.url)
    case 'file_read':      return s.filesRead.has(node.path)
    case 'email_read':     return s.emailsRead.has(node.emailId)
    case 'job_done':       return s.jobsCompleted.includes(node.jobId)
    case 'overseer_gte':   return s.overseerFlag >= node.value

    case 'and':            return node.children.every(c => evaluate(c, s))
    case 'or':             return node.children.some(c  => evaluate(c, s))
    case 'not':            return !evaluate(node.child, s)

    default: {
      const _: never = node
      console.warn('[engine/evaluate] Unknown condition op:', (_ as ConditionNode).op)
      return false
    }
  }
}

// ── snapshotGameState ─────────────────────────────────────────────────────────
// Builds a GameStateSnapshot from the live Zustand stores.
// Import and call this at the top of checkTriggers() instead of reading
// individual stores throughout the function.

export function snapshotGameState(): GameStateSnapshot {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useStoryStore }  = require('../../store/storyStore')   as typeof import('../../store/storyStore')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useRepStore }    = require('../../store/reputationStore') as typeof import('../../store/reputationStore')
  const story = useStoryStore.getState()
  const rep   = useRepStore.getState()

  return {
    phase:          story.phase,
    flags:          story.flags,
    missions:       story.missions,
    credits:        story.credits,
    compliance:     (rep as any).compliance ?? 0,
    shadow:         (rep as any).shadow     ?? 0,
    browserHistory: story.browserHistory ?? [],
    filesRead:      story.filesRead      ?? new Set(),
    emailsRead:     story.emailsRead     ?? new Set(),
    jobsCompleted:  story.jobsCompleted  ?? [],
    overseerFlag:   story.overseerFlag   ?? 0,
  }
}
