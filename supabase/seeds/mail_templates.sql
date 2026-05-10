-- Seed: story emails for GridOS
-- Run after migration 20260510_mail_templates.sql

INSERT INTO public.mail_templates
  (story_id, tag, from_address, subject, dot, watch_code, body)
VALUES
  (
    'WATCH-ACCESS',
    'SYSTEM',
    'compliance@gridos.corp',
    'Analyst Access – WATCH Intelligence System',
    '#ff3b5c',
    'WATCH-GRID-01',
    'GRIDCORP COMPLIANCE DIVISION

Based on your contract activity, you have been selected for analyst-level access to the WATCH Citizen Intelligence System.

WATCH is used by GridOS compliance analysts to review flagged citizen behavior and issue formal verdicts. Your decisions carry operational weight.

ACCESS CODE: WATCH-GRID-01

Enter this code in the App Store to install WATCH. Review your first case file and submit a verdict to complete your analyst onboarding.

Note: All WATCH activity is logged and attributed to your analyst profile. Decisions are permanent.

– GridOS Compliance Division'
  )
ON CONFLICT (story_id) DO UPDATE SET
  tag          = EXCLUDED.tag,
  from_address = EXCLUDED.from_address,
  subject      = EXCLUDED.subject,
  dot          = EXCLUDED.dot,
  watch_code   = EXCLUDED.watch_code,
  body         = EXCLUDED.body,
  updated_at   = NOW();
