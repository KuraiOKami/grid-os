// ── conditionTypes.ts ─────────────────────────────────────────────────────────
// AST node definitions for the condition evaluator.
//
// A ConditionNode is a recursive JSON-serialisable tree stored in the
// `condition_ast` JSONB columns of story_triggers and mission_objectives.
//
// Leaf nodes read game state; branch nodes compose with boolean logic.
//
// Example — "phase >= 2 AND flag OVERSEER_UNDERSTOOD is set":
//   {
//     op: 'and',
//     children: [
//       { op: 'phase_gte', value: 2 },
//       { op: 'flag', flag: 'OVERSEER_UNDERSTOOD' },
//     ]
//   }

import type { StoryFlag, MissionId, MissionStatus } from '../../store/storyStore'

// ── Leaf nodes ────────────────────────────────────────────────────────────────

/** Always true — default condition for triggers with no guard */
export interface AlwaysNode       { op: 'always' }

/** Always false — useful for disabling a trigger without deleting it */
export interface NeverNode        { op: 'never' }

/** True if the named flag is present in story.flags */
export interface FlagNode         { op: 'flag';        flag: StoryFlag }

/** True if the named flag is NOT present */
export interface NoFlagNode       { op: 'no_flag';     flag: StoryFlag }

/** True if story.phase >= value */
export interface PhaseGteNode     { op: 'phase_gte';   value: number }

/** True if story.phase === value */
export interface PhaseEqNode      { op: 'phase_eq';    value: number }

/** True if the named mission has the given status */
export interface MissionStatusNode {
  op: 'mission_status'
  missionId: MissionId
  status: MissionStatus
}

/** True if story.credits >= value */
export interface CreditsGteNode   { op: 'credits_gte'; value: number }

/** True if rep[stat] >= value (compliance or shadow) */
export interface RepGteNode       { op: 'rep_gte';     stat: 'compliance' | 'shadow'; value: number }

/** True if the given URL is in story.browserHistory */
export interface VisitedNode      { op: 'visited';     url: string }

/** True if the given fileId is in story.filesRead */
export interface FileReadNode     { op: 'file_read';   path: string }

/** True if the given emailId has been read (story.emailsRead) */
export interface EmailReadNode    { op: 'email_read';  emailId: string }

/** True if the given jobId is in story.jobsCompleted */
export interface JobDoneNode      { op: 'job_done';    jobId: string }

/** True if story.overseerFlag >= value */
export interface OverseerGteNode  { op: 'overseer_gte'; value: number }

// ── Branch nodes ──────────────────────────────────────────────────────────────

export interface AndNode          { op: 'and';  children: ConditionNode[] }
export interface OrNode           { op: 'or';   children: ConditionNode[] }
export interface NotNode          { op: 'not';  child: ConditionNode }

// ── Union ─────────────────────────────────────────────────────────────────────

export type ConditionNode =
  | AlwaysNode
  | NeverNode
  | FlagNode
  | NoFlagNode
  | PhaseGteNode
  | PhaseEqNode
  | MissionStatusNode
  | CreditsGteNode
  | RepGteNode
  | VisitedNode
  | FileReadNode
  | EmailReadNode
  | JobDoneNode
  | OverseerGteNode
  | AndNode
  | OrNode
  | NotNode
