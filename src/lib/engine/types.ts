// ── src/lib/engine/types.ts ───────────────────────────────────────────────────
// Shared types for the condition AST, effects, game state snapshot, and
// the Supabase row shape (TriggerRow). Pure — no store imports.

import type { MissionId, MissionStatus, StoryFlag } from '@/store/storyStore'

// ─────────────────────────────────────────────────────────────────────────────
// Condition AST
// Nodes are stored as JSON in story_triggers.condition_ast and
// mission_objectives.condition_ast.
// ─────────────────────────────────────────────────────────────────────────────

export type ConditionNode =
  | { type: 'and';     nodes:    ConditionNode[] }
  | { type: 'or';      nodes:    ConditionNode[] }
  | { type: 'not';     node:     ConditionNode }
  | { type: 'flag';    flag:     StoryFlag }
  | { type: 'no_flag'; flag:     StoryFlag }
  | { type: 'mission'; id:       MissionId; status: MissionStatus }
  | { type: 'phase_gte'; phase:  number }
  | { type: 'phase_eq';  phase:  number }
  | { type: 'rep_gte'; track:    RepTrack;  value:  number }
  | { type: 'rep_lt';  track:    RepTrack;  value:  number }
  | { type: 'overseer_gte'; value: number }
  | { type: 'page_visited'; url: string }
  | { type: 'job_done';    jobId: string }
  | { type: 'credits_gte'; amount: number }
  | { type: 'true' }   // unconditional — always fires

export type RepTrack = 'compliance' | 'shadow' | 'community'

// ─────────────────────────────────────────────────────────────────────────────
// Effects — what a trigger does when its condition is met
// ─────────────────────────────────────────────────────────────────────────────

export type Effect =
  | { type: 'set_flag';         flag:      StoryFlag }
  | { type: 'set_mission';      id:        MissionId; status: MissionStatus }
  | { type: 'complete_objective'; missionId: MissionId; objectiveId: string }
  | { type: 'add_credits';      amount:    number }
  | { type: 'adjust_overseer';  delta:     number }
  | { type: 'adjust_rep';       track:     RepTrack;   delta:  number }
  | { type: 'queue_email';      storyId:   string;     delayMs: number }
  | { type: 'drop_file';        name:      string;     content: string }
  | { type: 'set_phase';        phase:     0 | 1 | 2 | 3 | 4 | 5 | 6 }
  | { type: 'advance_phase' }
  | { type: 'console_warn';     message:   string }   // dev placeholder

// ─────────────────────────────────────────────────────────────────────────────
// Game state snapshot — what the evaluator reads (pure, no store references)
// ─────────────────────────────────────────────────────────────────────────────

export interface GameStateSnapshot {
  phase:          0 | 1 | 2 | 3 | 4 | 5 | 6
  flags:          ReadonlySet<StoryFlag>
  missions:       Readonly<Record<MissionId, MissionStatus>>
  overseerFlag:   number
  jobsCompleted:  readonly string[]
  browserHistory: readonly string[]
  credits:        number
  rep: {
    compliance: number
    shadow:     number
    community:  number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase row shape — mirrors public.story_triggers
// ─────────────────────────────────────────────────────────────────────────────

export interface TriggerRow {
  id:            string
  label:         string | null
  event_type:    string
  condition_ast: ConditionNode
  effects:       Effect[]
  enabled:       boolean
  created_at:    string
}

// ─────────────────────────────────────────────────────────────────────────────
// TriggerEvent — re-exported here so engine consumers import from one place
// ─────────────────────────────────────────────────────────────────────────────

export type TriggerEvent =
  | { type: 'page_visit';   url:      string }
  | { type: 'email_read';   emailId:  string }
  | { type: 'job_complete'; jobId:    string }
  | { type: 'file_read';    path:     string }
  | { type: 'open_app';     appId:    string }
  | { type: 'watch_submit'; decision: string }
  | { type: 'rep_change' }
  | { type: 'game_start' }
