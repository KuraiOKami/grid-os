-- Migration: player_state table
-- Persists per-player storyStore state so progress survives page refreshes.
-- Called by the write-through logic in storyStore.shim.ts.

CREATE TABLE IF NOT EXISTS public.player_state (
  player_id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phase             SMALLINT    NOT NULL DEFAULT 0,
  credits           INTEGER     NOT NULL DEFAULT 0,
  overseer_flag     SMALLINT    NOT NULL DEFAULT 0,
  gridfall_choice   TEXT        CHECK (gridfall_choice IN ('expose','bury','burn')),
  flags             TEXT[]      NOT NULL DEFAULT '{}',
  missions          JSONB       NOT NULL DEFAULT '{}'::jsonb,
  browser_history   TEXT[]      NOT NULL DEFAULT '{}',
  browser_unlocks   TEXT[]      NOT NULL DEFAULT '{}',
  pages_triggered   TEXT[]      NOT NULL DEFAULT '{}',
  filesystem_paths  TEXT[]      NOT NULL DEFAULT '{}',
  files_read        TEXT[]      NOT NULL DEFAULT '{}',
  emails_read       TEXT[]      NOT NULL DEFAULT '{}',
  jobs_completed    TEXT[]      NOT NULL DEFAULT '{}',
  factional_choices TEXT[]      NOT NULL DEFAULT '{}',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS player_state_updated_at ON public.player_state;
CREATE TRIGGER player_state_updated_at
  BEFORE UPDATE ON public.player_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.player_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_state_own_select"
  ON public.player_state FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "player_state_own_upsert"
  ON public.player_state FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "player_state_own_update"
  ON public.player_state FOR UPDATE
  USING (player_id = auth.uid());
