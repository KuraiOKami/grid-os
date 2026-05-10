-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: story engine tables
-- Phase 1c — story_triggers, missions, mission_objectives, story_files,
--            journal_entries
--
-- Follows the same conventions as 20260510_mail_templates.sql:
--   • set_updated_at() trigger already exists — reused here
--   • RLS enabled on all tables
--   • service_role handles writes; game client reads via anon/authed policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── story_triggers ────────────────────────────────────────────────────────────
-- Every named trigger in the game.  The condition_ast is the serialised
-- ConditionNode tree (see src/lib/engine/conditionTypes.ts).  effects is an
-- ordered array of Effect objects that fire when the condition evaluates true.

CREATE TABLE IF NOT EXISTS public.story_triggers (
  id            TEXT        PRIMARY KEY,          -- e.g. 'T-M01-START', 'T-SECTOR7-REVEAL'
  label         TEXT        NOT NULL,             -- human-readable admin label
  condition_ast JSONB       NOT NULL DEFAULT '{"op":"always"}'::jsonb,
  effects       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
  fire_once     BOOLEAN     NOT NULL DEFAULT TRUE, -- if true, disables self after first fire
  phase_min     SMALLINT,                          -- only eligible in phase >= this value
  phase_max     SMALLINT,                          -- only eligible in phase <= this value
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS story_triggers_updated_at ON public.story_triggers;
CREATE TRIGGER story_triggers_updated_at
  BEFORE UPDATE ON public.story_triggers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.story_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_triggers_read_all"
  ON public.story_triggers FOR SELECT USING (true);

-- ── missions ──────────────────────────────────────────────────────────────────
-- Top-level mission definitions.  MissionId enum values ('M-01', 'S-01', …)
-- are the primary keys so the game code can reference them by known ID.

CREATE TABLE IF NOT EXISTS public.missions (
  id              TEXT        PRIMARY KEY,          -- matches MissionId union in storyStore.ts
  title           TEXT        NOT NULL,
  giver           TEXT        NOT NULL,
  description     TEXT        NOT NULL,
  notes           TEXT,
  prereq_trigger  TEXT        REFERENCES public.story_triggers(id) ON DELETE SET NULL,
  reward_json     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  failure_json    JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS missions_updated_at ON public.missions;
CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "missions_read_all"
  ON public.missions FOR SELECT USING (true);

-- ── mission_objectives ────────────────────────────────────────────────────────
-- Individual objectives within a mission.  The condition_ast here is an
-- optional machine-checkable condition; some objectives are set imperatively
-- via MissionEvents instead — in that case condition_ast stays null.

CREATE TABLE IF NOT EXISTS public.mission_objectives (
  id            TEXT        PRIMARY KEY,          -- e.g. 'M01-OBJ-1'
  mission_id    TEXT        NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  label         TEXT        NOT NULL,
  condition_ast JSONB,                             -- null → imperative completion only
  sort_order    SMALLINT    NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mission_objectives_mission_id_idx
  ON public.mission_objectives (mission_id);

DROP TRIGGER IF EXISTS mission_objectives_updated_at ON public.mission_objectives;
CREATE TRIGGER mission_objectives_updated_at
  BEFORE UPDATE ON public.mission_objectives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mission_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mission_objectives_read_all"
  ON public.mission_objectives FOR SELECT USING (true);

-- ── story_files ───────────────────────────────────────────────────────────────
-- In-world text files dropped to the player filesystem.  The game's
-- fsAddFile() helper will eventually source content from here rather than
-- hardcoding strings in triggerEngine.ts.

CREATE TABLE IF NOT EXISTS public.story_files (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,         -- matches the filename, e.g. 'memo_1_it_reminder.txt'
  title       TEXT        NOT NULL,                -- display name in file viewer
  content     TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',   -- e.g. {'lore','corp','M-01'}
  gate_flag   TEXT,                                -- StoryFlag that must be set to read this file
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS story_files_updated_at ON public.story_files;
CREATE TRIGGER story_files_updated_at
  BEFORE UPDATE ON public.story_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.story_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "story_files_read_all"
  ON public.story_files FOR SELECT USING (true);

-- ── journal_entries ───────────────────────────────────────────────────────────
-- Per-player record of trigger firings — the audit trail / lore journal.
-- player_id references auth.users so each player's log is private.

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_id  TEXT        REFERENCES public.story_triggers(id) ON DELETE SET NULL,
  body        TEXT        NOT NULL,                -- rendered lore/event description
  phase       SMALLINT,                            -- phase at time of entry
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- no updated_at — journal entries are immutable after creation
);

CREATE INDEX IF NOT EXISTS journal_entries_player_id_idx
  ON public.journal_entries (player_id);

CREATE INDEX IF NOT EXISTS journal_entries_trigger_id_idx
  ON public.journal_entries (trigger_id);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Players can only read their own journal
CREATE POLICY "journal_entries_own_select"
  ON public.journal_entries FOR SELECT
  USING (player_id = auth.uid());

-- Players can insert their own entries (trigger fires client-side for now)
CREATE POLICY "journal_entries_own_insert"
  ON public.journal_entries FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- ── is_admin() helper ─────────────────────────────────────────────────────────
-- Used by Phase 2 /admin editor RLS policies.
-- Checks the 'role' key in the user's JWT app_metadata (set via Supabase dashboard
-- or service_role API: auth.admin.updateUserById(id, { app_metadata: { role: 'admin' } }))

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  )
$$;

-- Service-role / admin write policies for all content tables

CREATE POLICY "story_triggers_admin_write"
  ON public.story_triggers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "missions_admin_write"
  ON public.missions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "mission_objectives_admin_write"
  ON public.mission_objectives FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "story_files_admin_write"
  ON public.story_files FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
