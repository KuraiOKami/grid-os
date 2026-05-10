# Phase 1 — Engine & Schema

## What was built

### Phase 1c — Supabase Schema (migrations)

| File | Tables / Functions |
|---|---|
| `20260511_story_engine.sql` | `story_triggers`, `missions`, `mission_objectives`, `story_files`, `journal_entries`, `is_admin()` |
| `20260511_player_state.sql` | `player_state` — per-player progress persistence |

Apply both after the existing `20260510_mail_templates.sql`.

---

### Phase 1b — Condition Engine (`src/lib/engine/`)

| File | Purpose |
|---|---|
| `conditionTypes.ts` | `ConditionNode` AST union — every condition leaf/branch shape |
| `evaluate.ts` | `evaluate(node, snap): boolean` — pure, zero-React, zero-Zustand |
| `effects.ts` | `Effect` union — every effect shape that a trigger can produce |
| `dispatch.ts` | `dispatchEffect(effect)` — routes effects to the correct store mutation |
| `index.ts` | Barrel — `import { evaluate, dispatchAll } from '@/lib/engine'` |

---

### Phase 1d — Store shims + bridge

| File | Replaces / Augments |
|---|---|
| `src/store/storyStore.shim.ts` | `storyStore.ts` — adds Supabase write-through + hydration via `player_state` |
| `src/store/missionStore.shim.ts` | `missionStore.ts` — hydrates defs from DB, delegates status to storyStore |
| `src/store/triggerEngine.bridge.ts` | **Additive** — adds DB trigger evaluation without touching existing hand-coded cases |

---

## Migration steps (Phase 1d)

1. Apply `20260511_story_engine.sql` and `20260511_player_state.sql` to the Supabase project
2. Seed `missions` + `mission_objectives` from the `MISSION_DEFS` constant in `missionStore.ts` (via the Phase 2 admin editor or a one-off seed script)
3. `mv storyStore.ts storyStore.legacy.ts && mv storyStore.shim.ts storyStore.ts`
4. `mv missionStore.ts missionStore.legacy.ts && mv missionStore.shim.ts missionStore.ts`
5. In `triggerEngine.ts`, add at the top:
   ```ts
   import { runDatabaseTriggers } from './triggerEngine.bridge'
   ```
   And at the bottom of `checkTriggers()`, after the switch block:
   ```ts
   await runDatabaseTriggers(event)
   ```
6. `tsc --noEmit && vite build` — must be green before continuing
7. Delete `*.legacy.ts` files once smoke tests pass

---

## Condition AST quick reference

```ts
// Single flag
{ op: 'flag', flag: 'FIRST_JOB_DONE' }

// Phase guard AND flag
{ op: 'and', children: [
  { op: 'phase_gte', value: 2 },
  { op: 'flag', flag: 'OVERSEER_UNDERSTOOD' }
]}

// OR branch (compliance route OR shadow route)
{ op: 'or', children: [
  { op: 'rep_gte', stat: 'compliance', value: 65 },
  { op: 'rep_gte', stat: 'shadow', value: 40 }
]}
```

## Effect quick reference

```ts
{ type: 'set_flag',       flag: 'SECTOR7_KNOWN' }
{ type: 'set_mission',    missionId: 'M-03', status: 'active' }
{ type: 'queue_email',    storyId: 'E-12', delayMs: 1_200_000 }
{ type: 'drop_file',      slug: 'memo_2_overseer_anomaly_preliminary.txt' }
{ type: 'add_credits',    amount: 600 }
{ type: 'adjust_rep',     stat: 'shadow', delta: 3 }
{ type: 'adjust_overseer', delta: 5 }
{ type: 'journal_entry',  body: 'OVERSEER anomaly confirmed.', tags: ['overseer','M-03'] }
```

---

## Setting the admin role (Phase 2 prep)

```ts
// Service-role client only
await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'admin' }
})
```

The `is_admin()` SQL function reads `app_metadata.role` from the JWT and gates
all write policies on the content tables (`story_triggers`, `missions`,
`mission_objectives`, `story_files`).
