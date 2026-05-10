// ── effects.ts ────────────────────────────────────────────────────────────────
// Effect type union.  Every element in a trigger's `effects` JSON array must
// conform to one of these shapes.  The dispatcher in dispatch.ts routes each
// effect to the correct handler.
//
// Add new effect types here, add a handler in dispatch.ts.  That's the entire
// contract — no other files need to change.

import type { StoryFlag, MissionId } from '../../store/storyStore'

/** Set a story flag */
export interface SetFlagEffect        { type: 'set_flag';       flag: StoryFlag }

/** Remove a story flag */
export interface RemoveFlagEffect     { type: 'remove_flag';    flag: StoryFlag }

/** Activate, complete, or fail a mission */
export interface SetMissionEffect     { type: 'set_mission';    missionId: MissionId; status: 'active' | 'complete' | 'failed' }

/** Mark a single mission objective complete */
export interface SetObjectiveEffect   { type: 'set_objective';  missionId: MissionId; objectiveId: string }

/** Award or deduct credits */
export interface AddCreditsEffect     { type: 'add_credits';    amount: number }

/** Adjust compliance or shadow by a delta (can be negative) */
export interface AdjustRepEffect      { type: 'adjust_rep';     stat: 'compliance' | 'shadow'; delta: number }

/** Advance story phase */
export interface SetPhaseEffect       { type: 'set_phase';      phase: 0 | 1 | 2 | 3 | 4 | 5 | 6 }

/** Drop a file to the player filesystem (content fetched from story_files) */
export interface DropFileEffect       { type: 'drop_file';      slug: string }

/** Queue a story email (content from mail_templates) */
export interface QueueEmailEffect     { type: 'queue_email';    storyId: string; delayMs?: number }

/** Nudge the hidden OVERSEER pressure counter */
export interface AdjustOverseerEffect { type: 'adjust_overseer'; delta: number }

/** Unlock a browser URL in browserUnlocks */
export interface UnlockUrlEffect      { type: 'unlock_url';     url: string }

/** Log a journal entry for the current player */
export interface JournalEntryEffect   { type: 'journal_entry';  body: string; tags?: string[] }

export type Effect =
  | SetFlagEffect
  | RemoveFlagEffect
  | SetMissionEffect
  | SetObjectiveEffect
  | AddCreditsEffect
  | AdjustRepEffect
  | SetPhaseEffect
  | DropFileEffect
  | QueueEmailEffect
  | AdjustOverseerEffect
  | UnlockUrlEffect
  | JournalEntryEffect
