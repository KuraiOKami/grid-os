-- Migration: create mail_templates table
-- Stores all story-driven in-game emails so content is managed in Supabase
-- rather than hardcoded in game scripts.

CREATE TABLE IF NOT EXISTS public.mail_templates (
  story_id     TEXT        PRIMARY KEY,
  tag          TEXT        NOT NULL DEFAULT 'SYSTEM',
  from_address TEXT        NOT NULL,
  subject      TEXT        NOT NULL,
  dot          TEXT,                           -- notification dot hex color, e.g. '#ff3b5c'
  watch_code   TEXT,                           -- optional access code displayed in the mail
  body         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mail_templates_updated_at ON public.mail_templates;
CREATE TRIGGER mail_templates_updated_at
  BEFORE UPDATE ON public.mail_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: mail_templates is read-only to all authenticated/anon users (content is not sensitive).
-- Only service_role (server-side) can insert/update/delete.
ALTER TABLE public.mail_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mail_templates_read_all"
  ON public.mail_templates
  FOR SELECT
  USING (true);
